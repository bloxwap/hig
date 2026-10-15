import XCTest

/// iOS Simulator verification of the packed HIG native gallery (com.bloxwap.hig.gallery).
/// XCUITest reads the accessibility tree, performs accessibility increment/decrement and runs
/// Xcode's automated accessibility audit. VoiceOver itself does not run in the Simulator, so these
/// are automated/simulator observations, not VoiceOver user-flow or physical-device evidence.

/// XCUITest exposes increment()/decrement() only on macOS. On iOS this performs the same
/// accessibility increment/decrement action (what VoiceOver's swipe up/down sends) through
/// XCTest's accessibility client. Private API: used for simulator verification only.
enum AXAdjust {
  typealias Factory = @convention(c) (AnyObject, Selector, Int) -> AnyObject
  typealias Perform = @convention(c) (AnyObject, Selector, Int, AnyObject, AnyObject?, UnsafeMutablePointer<NSError?>?) -> Bool
  static func perform(_ element: XCUIElement, increment: Bool) -> String {
    guard let actionClass = NSClassFromString("XCUIAccessibilityAction"), let clientClass = NSClassFromString("XCAXClient_iOS") as? NSObject.Type else { return "unavailable: classes" }
    let factory = NSSelectorFromString(increment ? "incrementActionForPlatform:" : "decrementActionForPlatform:")
    guard let factoryMethod = class_getClassMethod(actionClass, factory) else { return "unavailable: factory" }
    let action = unsafeBitCast(method_getImplementation(factoryMethod), to: Factory.self)(actionClass, factory, 2)
    guard let number = (action as? NSObject)?.value(forKey: "actionNumber") as? Int else { return "unavailable: action number" }
    guard let client = clientClass.perform(NSSelectorFromString("sharedClient"))?.takeUnretainedValue() as? NSObject else { return "unavailable: client" }
    guard let snapshot = try? element.snapshot(), let target = (snapshot as AnyObject).value(forKey: "accessibilityElement") as AnyObject? else { return "unavailable: element" }
    let selector = NSSelectorFromString("performAction:onElement:value:error:")
    guard let method = class_getInstanceMethod(type(of: client), selector) else { return "unavailable: perform" }
    var error: NSError?
    let ok = unsafeBitCast(method_getImplementation(method), to: Perform.self)(client, selector, number, target, nil, &error)
    return ok ? "performed AXAction \(number)" : "failed AXAction \(number): \(error?.localizedDescription ?? "unknown")"
  }
}

final class NativeVerificationUITests: XCTestCase {
  private let env = ProcessInfo.processInfo.environment
  private var app: XCUIApplication!
  private var out: URL!

  override func setUpWithError() throws {
    continueAfterFailure = true
    out = URL(fileURLWithPath: env["HIG_OUT"] ?? NSTemporaryDirectory()).appendingPathComponent("ios-raw")
    for dir in ["", "trees", "captures"] { try FileManager.default.createDirectory(at: out.appendingPathComponent(dir), withIntermediateDirectories: true) }
    app = XCUIApplication(bundleIdentifier: "com.bloxwap.hig.gallery")
    if let args = env["HIG_LAUNCH_ARGS"], !args.isEmpty { app.launchArguments = args.split(separator: "|").map(String.init) }
    app.launch()
    XCTAssertTrue(app.staticTexts["Native HIG gallery"].waitForExistence(timeout: 20), "gallery rendered")
  }

  private func open(_ query: String) {
    app.open(URL(string: "bloxwaphig://gallery?\(query)")!)
    // iOS 26 asks before routing a custom scheme to an app; accept the system prompt.
    let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
    let confirm = springboard.buttons["Open"]
    if confirm.waitForExistence(timeout: 1.5) { confirm.tap() }
    _ = app.staticTexts["Native HIG gallery"].waitForExistence(timeout: 10)
    Thread.sleep(forTimeInterval: 0.9)
  }

  private func write(_ name: String, _ object: Any) throws {
    let data = try JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted, .sortedKeys])
    try data.write(to: out.appendingPathComponent(name))
  }

  private func capture(_ name: String) throws {
    try XCUIScreen.main.screenshot().pngRepresentation.write(to: out.appendingPathComponent("captures/\(name).png"))
  }

  private func tree(_ name: String) throws {
    try app.debugDescription.write(to: out.appendingPathComponent("trees/\(name).txt"), atomically: true, encoding: .utf8)
  }

  private func audit(_ component: String) -> [[String: String]] {
    var issues: [[String: String]] = []
    do {
      try app.performAccessibilityAudit(for: .all) { issue in
        issues.append(["component": component, "type": String(describing: issue.auditType), "summary": issue.compactDescription, "detail": issue.detailedDescription, "element": issue.element.map { "\($0.elementType.rawValue):\($0.label)" } ?? ""])
        return true
      }
    } catch { issues.append(["component": component, "type": "audit-error", "summary": String(describing: error), "detail": "", "element": ""]) }
    return issues
  }

  private func label(_ prefix: String) -> String? {
    let match = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", prefix)).firstMatch
    return match.waitForExistence(timeout: 3) ? match.label : nil
  }

  func testGalleryCaptures() throws {
    let prefix = env["HIG_PREFIX"] ?? "ios"
    let extra = env["HIG_QUERY"] ?? ""
    let runAudit = env["HIG_AUDIT"] != "0"
    var results: [[String: Any]] = []
    var issues: [[String: String]] = []
    for component in (env["HIG_COMPONENTS"] ?? "Button").split(separator: ",").map(String.init) {
      open("component=\(component)&state=default\(extra)")
      try tree("\(prefix)-\(component)")
      try capture("\(prefix)-\(component)")
      let found = runAudit ? audit(component) : []
      issues += found
      results.append(["component": component, "auditIssues": found.count, "buttons": app.buttons.count, "staticTexts": app.staticTexts.count, "sliders": app.sliders.count, "textFields": app.textFields.count])
    }
    try write("\(prefix)-gallery.json", ["results": results, "auditIssues": issues])
  }

  func testSliderAccessibilityActions() throws {
    open("component=Slider&state=default")
    var r: [String: Any] = [:]
    let slider = app.sliders["Volume preview"]
    r["found"] = slider.waitForExistence(timeout: 5)
    guard slider.exists else { try write("ios-slider.json", r); return }
    r["initialValue"] = slider.value as? String ?? ""
    r["initialLabel"] = label("Volume preview: ") ?? ""
    var steps: [[String: Any]] = []
    for increment in [true, true, false] {
      let result = AXAdjust.perform(slider, increment: increment)
      Thread.sleep(forTimeInterval: 0.6)
      steps.append(["action": increment ? "accessibilityIncrement" : "accessibilityDecrement", "result": result, "accessibilityValue": slider.value as? String ?? "", "visibleLabel": label("Volume preview: ") ?? ""])
    }
    slider.adjust(toNormalizedSliderPosition: 0.8)
    Thread.sleep(forTimeInterval: 0.5)
    steps.append(["action": "adjust(0.8)", "accessibilityValue": slider.value as? String ?? "", "visibleLabel": label("Volume preview: ") ?? ""])
    r["steps"] = steps
    try capture("ios-slider-after-actions")
    open("component=Slider&state=disabled")
    let disabled = app.sliders["Volume preview"]
    if disabled.waitForExistence(timeout: 5) {
      let before = label("Volume preview: ") ?? ""
      let result = AXAdjust.perform(disabled, increment: true)
      Thread.sleep(forTimeInterval: 0.6)
      r["disabled"] = ["isEnabled": disabled.isEnabled, "result": result, "labelBefore": before, "labelAfter": label("Volume preview: ") ?? ""]
    }
    try write("ios-slider.json", r)
  }

  func testOverlays() throws {
    var results: [[String: Any]] = []
    for (component, trigger, title) in [("Dialog", "Open review order", "Review order"), ("AlertDialog", "Open confirm cancellation", "Confirm cancellation"), ("Sheet", "Open order details", "Order details"), ("Menu", "Market actions", "Market actions")] {
      open("component=\(component)&state=default")
      var r: [String: Any] = ["component": component]
      let button = app.buttons[trigger]
      r["triggerFound"] = button.waitForExistence(timeout: 5)
      guard button.exists else { results.append(r); continue }
      button.tap()
      let close = app.buttons["Close"]
      r["closeVisible"] = close.waitForExistence(timeout: 5)
      r["titleVisible"] = app.staticTexts[title].exists
      r["titleIsHeader"] = app.staticTexts.matching(NSPredicate(format: "label == %@", title)).allElementsBoundByIndex.contains { $0.elementType == .staticText && $0.debugDescription.contains("Header") }
      r["galleryHeadingReachableWhileOpen"] = app.staticTexts["Native HIG gallery"].exists && app.staticTexts["Native HIG gallery"].isHittable
      try tree("ios-overlay-\(component)")
      try capture("ios-overlay-\(component)-open")
      let auditIssues = audit("\(component)-open")
      r["auditIssuesWhileOpen"] = auditIssues
      if close.exists { close.tap() }
      Thread.sleep(forTimeInterval: 0.8)
      r["closedByCloseButton"] = !app.buttons["Close"].exists
      r["triggerHittableAfterClose"] = app.buttons[trigger].exists && app.buttons[trigger].isHittable
      results.append(r)
    }
    try write("ios-overlays.json", results)
  }

  func testListScrolling() throws {
    open("component=List&state=default&rows=2000")
    var r: [String: Any] = [:]
    r["firstRowVisible"] = app.staticTexts["Verification row 1"].waitForExistence(timeout: 6)
    var samples: [[String: Any]] = []
    let start = Date()
    for i in 1...24 {
      app.swipeUp(velocity: .fast)
      if i % 6 == 0 {
        let visible = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH 'Verification row'")).allElementsBoundByIndex.filter { $0.isHittable }.map { $0.label }
        samples.append(["afterSwipes": i, "firstHittable": visible.first ?? "", "hittableCount": visible.count])
      }
    }
    r["elapsedSeconds"] = Date().timeIntervalSince(start)
    r["samples"] = samples
    try capture("ios-list-scrolled")
    try write("ios-list.json", r)
  }

  private func reveal(_ element: XCUIElement) {
    for _ in 0..<8 where !(element.exists && element.isHittable) { app.swipeUp() }
  }

  func testFeedbackCalls() throws {
    open("component=Button&state=default&diag=1")
    var r: [String: Any] = ["diagnosticsBefore": label("Feedback calls:") ?? ""]
    for name in ["Sound", "Haptics", "Motion", "Motion"] {
      let toggle = app.switches[name]
      reveal(toggle)
      if toggle.exists { toggle.tap(); Thread.sleep(forTimeInterval: 1.2) } else { r["missing-\(name)"] = true }
    }
    for _ in 0..<8 { app.swipeDown() }
    Thread.sleep(forTimeInterval: 1.5)
    r["diagnosticsAfter"] = label("Feedback calls:") ?? ""
    try capture("ios-feedback-diagnostics")
    try write("ios-feedback.json", r)
  }

  func testKeyboardAvoidance() throws {
    var results: [[String: Any]] = []
    for component in ["Field", "TradeEntry"] {
      open("component=\(component)&state=default")
      let field = app.textFields.firstMatch
      var r: [String: Any] = ["component": component, "inputFound": field.waitForExistence(timeout: 5)]
      if field.exists {
        field.tap()
        let keyboard = app.keyboards.firstMatch
        r["keyboardShown"] = keyboard.waitForExistence(timeout: 4)
        Thread.sleep(forTimeInterval: 0.8)
        r["inputFrame"] = NSCoder.string(for: field.frame)
        if keyboard.exists {
          r["keyboardFrame"] = NSCoder.string(for: keyboard.frame)
          r["inputAboveKeyboard"] = field.frame.maxY <= keyboard.frame.minY
          r["keyboardType"] = keyboard.keys.count
          r["decimalKeyPresent"] = keyboard.keys["."].exists || keyboard.keys[","].exists
        }
        try capture("ios-keyboard-\(component)")
      }
      results.append(r)
    }
    try write("ios-keyboard.json", results)
  }

  func testSnapshot() throws {
    let name = env["HIG_NAME"] ?? "snapshot"
    open(env["HIG_QUERY"] ?? "component=Button&state=default&diag=1")
    var r: [String: Any] = ["name": name]
    for key in ["Runtime:", "Font scale:", "OS RTL:", "OS reduce motion:", "Feedback calls:"] { r[key] = label(key) ?? NSNull() }
    try tree("ios-\(name)")
    try capture("ios-\(name)")
    if env["HIG_AUDIT"] != "0" { r["auditIssues"] = audit(name) }
    try write("ios-\(name).json", r)
  }
}
