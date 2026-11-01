import XCTest

/// Isolated host-adoption checks (#117–#121). Simulator touch/layout evidence; no VoiceOver claim.
final class AdoptionVerificationUITests: XCTestCase {
  private var app: XCUIApplication!
  private var output: URL!
  private let env = ProcessInfo.processInfo.environment

  override func setUpWithError() throws {
    continueAfterFailure = false
    output = URL(fileURLWithPath: env["HIG_OUT"] ?? NSTemporaryDirectory())
    for directory in ["", "captures", "trees"] {
      try FileManager.default.createDirectory(at: output.appendingPathComponent(directory), withIntermediateDirectories: true)
    }
    app = XCUIApplication(bundleIdentifier: "com.bloxwap.hig.gallery")
    app.launch()
    XCTAssertTrue(find("adoption-ready").waitForExistence(timeout: 30), "optional adoption fixture rendered")
  }

  private func find(_ id: String) -> XCUIElement {
    app.descendants(matching: .any).matching(identifier: id).firstMatch
  }

  private func open(_ section: String) {
    app.open(URL(string: "bloxwaphig://adoption?section=\(section)")!)
    let confirm = XCUIApplication(bundleIdentifier: "com.apple.springboard").buttons["Open"]
    if confirm.waitForExistence(timeout: 1) { confirm.tap() }
    XCTAssertTrue(find("adoption-ready").waitForExistence(timeout: 10))
    Thread.sleep(forTimeInterval: 0.7)
  }

  private func capture(_ name: String) throws {
    try XCUIScreen.main.screenshot().pngRepresentation.write(to: output.appendingPathComponent("captures/\(name).png"))
    try app.debugDescription.write(to: output.appendingPathComponent("trees/\(name).txt"), atomically: true, encoding: .utf8)
  }

  private func write(_ name: String, _ result: [String: Any]) throws {
    let data = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
    try data.write(to: output.appendingPathComponent("\(name).json"))
  }

  @discardableResult
  private func reveal(_ element: XCUIElement, in scroll: XCUIElement, limit: Int = 24) -> Int {
    var swipes = 0
    while !element.isHittable && swipes < limit { scroll.swipeUp(); swipes += 1 }
    return swipes
  }

  private func assertFinalNumber(_ expected: String, timeout: TimeInterval = 6) {
    let readout = find("adoption-number")
    XCTAssertTrue(readout.waitForExistence(timeout: 10))
    let deadline = Date().addingTimeInterval(timeout)
    var actual = readout.label
    while actual != expected && Date() < deadline {
      Thread.sleep(forTimeInterval: 0.1)
      actual = readout.label
    }
    XCTAssertEqual(actual, expected, "canonical final accessible number label")
  }

  private func tapNumberControl(_ id: String, in scroll: XCUIElement) {
    let control = find(id)
    reveal(control, in: scroll)
    XCTAssertTrue(control.isHittable, "number control is reachable: \(id)")
    control.tap()
  }

  /// Exact final labels exercise Hermes Intl behavior without claiming visual bidi or animation certification.
  func testNumberFlow() throws {
    open("number")
    Thread.sleep(forTimeInterval: 0.8)
    let prefix = env["HIG_ADOPTION_PREFIX"] ?? "default", full = env["HIG_ADOPTION_NUMBER_MODE"] != "smoke"
    let environment = find("adoption-number-environment"), scroll = find("adoption-number-scroll")
    XCTAssertTrue(environment.waitForExistence(timeout: 10))
    if let motion = env["HIG_ADOPTION_EXPECT_MOTION"] { XCTAssertTrue(environment.label.contains("motion \(motion)"), environment.label) }
    if let value = env["HIG_ADOPTION_MIN_FONT_SCALE"], let minimum = Double(value) {
      let scale = Double(environment.label.components(separatedBy: "scale ").last?.components(separatedBy: " ").first ?? "") ?? 0
      XCTAssertGreaterThanOrEqual(scale, minimum, environment.label)
    }
    typealias LocaleCase = (id: String, direction: String, initial: String, carry: String, group: String, sign: String, fraction: String, burst: String)
    let all: [LocaleCase] = [
      ("en-US", "ltr", "999.99", "1,000.00", "1,234,567.89", "-250.50", "12.30", "7,654,321.09"),
      ("ar-EG", "rtl", "٩٩٩٫٩٩", "١٬٠٠٠٫٠٠", "١٬٢٣٤٬٥٦٧٫٨٩", "\u{061C}-٢٥٠٫٥٠", "١٢٫٣٠", "٧٬٦٥٤٬٣٢١٫٠٩"),
      ("fa-IR", "rtl", "۹۹۹٫۹۹", "۱٬۰۰۰٫۰۰", "۱٬۲۳۴٬۵۶۷٫۸۹", "\u{200E}−۲۵۰٫۵۰", "۱۲٫۳۰", "۷٬۶۵۴٬۳۲۱٫۰۹"),
      ("ar-EG", "ltr", "٩٩٩٫٩٩", "١٬٠٠٠٫٠٠", "١٬٢٣٤٬٥٦٧٫٨٩", "\u{061C}-٢٥٠٫٥٠", "١٢٫٣٠", "٧٬٦٥٤٬٣٢١٫٠٩")
    ]
    var results: [[String: Any]] = []
    for item in full ? all : all.filter({ $0.id == "ar-EG" && $0.direction == "ltr" }) {
      tapNumberControl("adoption-locale-\(item.id)", in: scroll)
      if item.id == "ar-EG" && item.direction == "ltr" { tapNumberControl("adoption-number-direction", in: scroll) }
      XCTAssertTrue(environment.label.contains("locale \(item.id)"), environment.label)
      XCTAssertTrue(environment.label.contains("direction \(item.direction)"), environment.label)
      assertFinalNumber("Number flow: \(item.initial)")
      if full {
        tapNumberControl("adoption-number-carry", in: scroll)
        assertFinalNumber("Number flow: \(item.carry)")
      }
      tapNumberControl("adoption-number-group", in: scroll)
      assertFinalNumber("Number flow: \(item.group)")
      if full {
        tapNumberControl("adoption-number-sign", in: scroll)
        assertFinalNumber("Number flow: \(item.sign)")
        tapNumberControl("adoption-number-fraction", in: scroll)
        assertFinalNumber("Number flow: \(item.fraction)")
      }
      tapNumberControl("adoption-number-burst", in: scroll)
      assertFinalNumber("Number flow: \(item.burst)")
      Thread.sleep(forTimeInterval: 0.7)
      XCTAssertEqual(find("adoption-number").label, "Number flow: \(item.burst)", "latest burst value remains final after old animations would have settled")
      let readout = find("adoption-number")
      var upward = 0
      while !readout.isHittable && upward < 24 { scroll.swipeDown(); upward += 1 }
      XCTAssertTrue(readout.isHittable)
      try capture("number-\(prefix)-\(item.id)-\(item.direction)")
      tapNumberControl("adoption-number-null", in: scroll)
      assertFinalNumber("Number flow: —")
      var rtlStatic = ""
      if full {
        tapNumberControl("adoption-number-nan", in: scroll)
        assertFinalNumber("Number flow: —")
        tapNumberControl("adoption-number-infinity", in: scroll)
        assertFinalNumber("Number flow: —")
        if item.id == "ar-EG" && item.direction == "ltr" {
          tapNumberControl("adoption-number-direction", in: scroll)
          XCTAssertTrue(environment.label.contains("direction rtl"), environment.label)
          tapNumberControl("adoption-number-group", in: scroll)
          assertFinalNumber("Number flow: \(item.group)")
          rtlStatic = "Number flow: \(item.group)"
        }
      }
      results.append(["locale": item.id, "direction": item.direction, "initial": item.initial, "group": item.group, "burst": item.burst, "fallback": "—", "rtlStaticFallback": rtlStatic, "environment": environment.label])
    }
    try write("number-\(prefix)", ["mode": full ? "full" : "smoke", "cases": results, "limits": "Final accessibility labels only; ar-EG LTR supplies localized reels without relying on iOS Hermes numbering-system extensions. Captures require visual/manual glyph, bidi and animation review. No VoiceOver speech or physical-device claim."])
  }

  func testTypographyAndBusySpacing() throws {
    open("type")
    let registration = find("adoption-font-registration").label
    for face in ["BloxwapSansRegular", "BloxwapSansSemiBold", "BloxwapMonoRegular", "BloxwapSansKRRegular", "BloxwapSansKRSemiBold", "BloxwapSansSCRegular", "BloxwapSansSCSemiBold"] {
      XCTAssertTrue(registration.contains(face), "font registered: \(face)")
    }
    XCTAssertTrue(find("adoption-ready").label.contains("locale en-US"))
    try capture("type-companions")
    let scroll = find("adoption-type-scroll")
    let positive = find("adoption-positive"), negative = find("adoption-negative"), animated = find("adoption-animated")
    reveal(positive, in: scroll)
    XCTAssertTrue(positive.isHittable)
    XCTAssertEqual(positive.label, "Positive balance: 1,250.25")
    XCTAssertEqual(negative.label, "Negative change: -250.50")
    var result: [String: Any] = ["registration": registration, "environment": find("adoption-ready").label, "positiveFrame": NSCoder.string(for: positive.frame), "negativeFrame": NSCoder.string(for: negative.frame)]
    let busy = find("adoption-busy")
    reveal(busy, in: scroll)
    XCTAssertTrue(busy.exists)
    XCTAssertFalse(busy.isEnabled)
    result["busyLabel"] = busy.label
    result["busyFrame"] = NSCoder.string(for: busy.frame)
    result["animatedFrame"] = NSCoder.string(for: animated.frame)
    app.buttons["Update number"].tap()
    Thread.sleep(forTimeInterval: 0.4)
    XCTAssertEqual(animated.label, "Animated balance: 1,251.25")
    result["animatedUpdatedLabel"] = animated.label
    try capture("type-readouts-busy")
    try write("typography", result)
  }

  func testToastRecoveryAndDismissal() throws {
    open("toast")
    let prefix = env["HIG_ADOPTION_PREFIX"] ?? "default"
    let viewport = find("adoption-toast")
    // RN's labelled scroll container is exposed as Other by XCTest; swipe its visible host viewport.
    let scroll = viewport
    XCTAssertTrue(viewport.waitForExistence(timeout: 10))
    XCTAssertLessThanOrEqual(viewport.frame.height, app.windows.firstMatch.frame.height * 0.61)
    XCTAssertTrue(find("adoption-retry-1").exists)
    try capture("toast-\(prefix)-first")
    let recovery = find("adoption-retry-8")
    let swipes = reveal(recovery, in: scroll, limit: 40)
    XCTAssertTrue(recovery.isHittable, "last recovery action is reachable by scrolling")
    try capture("toast-\(prefix)-last")
    recovery.tap()
    XCTAssertEqual(find("adoption-result").label, "Recovered request 8")
    let dismiss = app.buttons["Dismiss Request 8 failed"]
    reveal(dismiss, in: scroll)
    XCTAssertTrue(dismiss.isHittable)
    dismiss.tap()
    XCTAssertEqual(find("adoption-result").label, "Dismissed request 8")
    XCTAssertFalse(find("adoption-retry-8").exists)
    XCTAssertTrue(find("adoption-retry-7").exists, "other notices remain")
    try capture("toast-\(prefix)-dismissed")
    try write("toast-\(prefix)", ["environment": find("adoption-ready").label, "viewportFrame": NSCoder.string(for: viewport.frame), "scrollSwipesToLastRecovery": swipes, "recoveredRequest": 8, "dismissedRequest": 8, "remainingRequest7": find("adoption-retry-7").exists])
  }

  func testCustomSheetCardStack() throws {
    open("sheet")
    let trigger = find("adoption-open-sheet")
    trigger.tap()
    let title = find("adoption-card-title")
    XCTAssertTrue(title.waitForExistence(timeout: 10))
    Thread.sleep(forTimeInterval: 0.7)
    XCTAssertEqual(title.label, "Account")
    XCTAssertEqual(app.buttons.matching(NSPredicate(format: "label == 'Done'")).count, 1)
    XCTAssertFalse(app.buttons["Close"].exists, "custom content has no built-in Close")
    let accountY = title.frame.minY
    try capture("sheet-account-45")
    find("adoption-switch-card").tap()
    Thread.sleep(forTimeInterval: 0.9)
    XCTAssertEqual(title.label, "Activity")
    let activityY = title.frame.minY
    XCTAssertLessThan(activityY, accountY - 50, "card detent changed while the sheet remained open")
    try capture("sheet-activity-70")
    let end = find("adoption-card-end"), scroll = find("adoption-card-scroll")
    let swipes = reveal(end, in: scroll)
    XCTAssertTrue(end.isHittable, "nested card scroll reaches its last action")
    end.tap()
    find("adoption-close-sheet").tap()
    Thread.sleep(forTimeInterval: 0.7)
    XCTAssertFalse(find("adoption-card-title").exists)
    XCTAssertTrue(trigger.isHittable)
    XCTAssertEqual(find("adoption-result").label, "Sheet closed")
    try capture("sheet-closed")
    try write("sheet", ["accountTitleY": accountY, "activityTitleY": activityY, "nestedScrollSwipes": swipes, "triggerHittableAfterClose": trigger.isHittable, "callerCloseCount": 1, "builtInCloseCount": 0])
  }
}
