import '@testing-library/jest-dom'

// jsdom doesn't perform real layout, so getBoundingClientRect() returns an
// all-zero rect by default. Components that compute click positions relative
// to an element's bounding box (e.g. DamageMarkerEditor) would otherwise
// divide by zero and produce NaN coordinates in tests. A fixed, realistic
// rect keeps that math sane across the whole suite.
Element.prototype.getBoundingClientRect = () => ({
  width: 500,
  height: 220,
  top: 0,
  left: 0,
  bottom: 220,
  right: 500,
  x: 0,
  y: 0,
  toJSON: () => {},
})
