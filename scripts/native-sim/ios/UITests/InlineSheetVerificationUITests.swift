import XCTest

/// Public inline/dynamic backend touch and layout checks; no VoiceOver or physical-device claim.
final class InlineSheetVerificationUITests: XCTestCase {
  private var app: XCUIApplication!
  private var output: URL!
  private func find(_ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
  override func setUpWithError() throws {
    continueAfterFailure = false
    output = URL(fileURLWithPath: ProcessInfo.processInfo.environment["HIG_OUT"] ?? NSTemporaryDirectory())
    try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
    app = XCUIApplication(bundleIdentifier: "com.bloxwap.hig.gallery")
    app.launch()
    XCTAssertTrue(find("inline-ready").waitForExistence(timeout: 30))
  }
  private func capture(_ name: String) throws {
    try XCUIScreen.main.screenshot().pngRepresentation.write(to: output.appendingPathComponent("\(name).png"))
    try app.debugDescription.write(to: output.appendingPathComponent("\(name).txt"), atomically: true, encoding: .utf8)
  }
  private func settle() { Thread.sleep(forTimeInterval: 0.8) }
  func testRetainedInlineLifecycle() throws {
    settle()
    XCTAssertTrue(find("inline-ready").label.contains("closed · mounts 1 · settled 0"))
    XCTAssertFalse(app.buttons["Choose ETH"].exists, "prepared closed content is hidden from accessibility")
    try capture("inline-prepared-closed")
    find("inline-open").tap(); settle()
    app.buttons["Choose ETH"].tap()
    XCTAssertEqual(find("inline-selection").label, "Selected ETH")
    let query = find("inline-query")
    query.tap(); settle()
    for character in ["B", "T", "C"] { query.typeText(character); Thread.sleep(forTimeInterval: 0.25) }
    query.typeText("\n"); settle()
    XCTAssertEqual(query.value as? String, "BTC", "paced simulator typing reached the controlled input")
    let list = find("inline-list"), end = find("inline-end")
    try capture("inline-opened-before-scroll")
    XCTAssertLessThanOrEqual(list.frame.maxY, app.windows.firstMatch.frame.maxY + 1, "HIG custom wrappers bound the native scroll viewport")
    var swipes = 0
    while !end.isHittable && swipes < 16 { list.swipeUp(); swipes += 1 }
    XCTAssertTrue(end.isHittable)
    try capture("inline-list-end")
    app.buttons["Reject next close"].tap()
    app.buttons["Try close"].tap(); settle()
    XCTAssertEqual(find("inline-result").label, "Close rejected")
    XCTAssertTrue(find("inline-ready").label.contains("open · mounts 1 · settled 0"))
    XCTAssertTrue(end.isHittable, "rejected close preserves list offset")
    try capture("inline-rejected-close")
    app.buttons["Done"].tap(); settle()
    XCTAssertTrue(find("inline-ready").label.contains("closed · mounts 1 · settled 1"))
    XCTAssertFalse(app.buttons["Choose ETH"].exists)
    XCTAssertTrue(find("inline-open").isHittable)
    find("inline-open").tap(); settle()
    XCTAssertEqual(find("inline-selection").label, "Selected ETH")
    XCTAssertEqual(query.value as? String, "BTC")
    XCTAssertTrue(end.isHittable, "accepted close and reopen preserve native list offset")
    XCTAssertTrue(find("inline-ready").label.contains("open · mounts 1 · settled 1"))
    try capture("inline-reopened")
    let evidence: [String: Any] = ["preparedMounts": 1, "acceptedSettled": 1, "rejectedSettled": 0, "query": query.value ?? "", "selection": find("inline-selection").label, "lastActionHittableAfterReopen": end.isHittable, "swipesToLastAction": swipes]
    try JSONSerialization.data(withJSONObject: evidence, options: [.prettyPrinted, .sortedKeys]).write(to: output.appendingPathComponent("inline.json"))
  }
  private func dynamicMeasurement(motion: String) throws {
    app.open(URL(string: "bloxwaphig://inline?motion=\(motion)")!)
    let confirm = XCUIApplication(bundleIdentifier: "com.apple.springboard").buttons["Open"]
    if confirm.waitForExistence(timeout: 1) { confirm.tap() }
    settle()
    XCTAssertTrue(find("inline-ready").label.contains("motion \(motion)"))
    app.buttons["Open measured card"].tap(); settle()
    let title = find("dynamic-title"), window = app.windows.firstMatch.frame
    XCTAssertTrue(title.waitForExistence(timeout: 10))
    let shortY = title.frame.minY
    XCTAssertGreaterThan(shortY, window.minY)
    XCTAssertLessThan(shortY, window.maxY)
    try capture("dynamic-\(motion)-short")
    app.buttons["Change content height"].tap(); settle()
    let tallY = title.frame.minY
    XCTAssertLessThan(tallY, shortY - 60, "dynamic content grows after the content change")
    XCTAssertGreaterThanOrEqual(tallY, window.height - 563, "560pt content ceiling is not crossed")
    XCTAssertLessThanOrEqual(tallY, window.height - 480, "tall content reaches the bounded detent")
    XCTAssertTrue(app.buttons["Close measured card"].isHittable)
    try capture("dynamic-\(motion)-tall")
    app.buttons["Change content height"].tap(); settle()
    let restoredY = title.frame.minY
    XCTAssertEqual(restoredY, shortY, accuracy: 3, "dynamic content shrinks back to its measured short size")
    try capture("dynamic-\(motion)-restored")
    app.buttons["Close measured card"].tap(); settle()
    XCTAssertTrue(find("inline-open").isHittable)
    let evidence: [String: Any] = ["motion": motion, "shortTitleY": shortY, "tallTitleY": tallY, "restoredTitleY": restoredY, "ceiling": 560, "windowHeight": window.height, "limits": "Simulator geometry only; animation smoothness and physical-device behavior need visual/manual observation."]
    try JSONSerialization.data(withJSONObject: evidence, options: [.prettyPrinted, .sortedKeys]).write(to: output.appendingPathComponent(motion == "normal" ? "dynamic.json" : "dynamic-reduced.json"))
  }
  func testDynamicMeasurement() throws { try dynamicMeasurement(motion: "normal") }
  func testDynamicMeasurementReducedMotion() throws { try dynamicMeasurement(motion: "reduced") }
}
