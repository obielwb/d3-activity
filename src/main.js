import * as d3 from 'd3';

// Remove margins to allow the SVG to fill the whole screen cleanly
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

const width = window.innerWidth;
const height = window.innerHeight;

// Create the main SVG container
const svg = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .style('position', 'absolute')
  .style('top', 0)
  .style('left', 0);

// Define a more natural, wavy flight path for the bee
// using a Catmull-Rom spline through multiple points
const beeSize = 100;

const points = [
  [-beeSize, height * 0.6],             // start off-screen
  [width * 0.1, height * 0.2],          // swoop up
  [width * 0.25, height * 0.8],         // swoop down
  [width * 0.2, height * 0.4],          // little loop backing up
  [width * 0.35, height * 0.3],         // up and right
  [width * 0.5, height * 0.5],          // CENTER (pause here)
  [width * 0.65, height * 0.7],         // down and right
  [width * 0.8, height * 0.4],          // another backward loop
  [width * 0.75, height * 0.8],         // down
  [width * 0.9, height * 0.2],          // up
  [width + beeSize, height * 0.5]       // end off-screen
];

const pathGenerator = d3.line()
  .curve(d3.curveCatmullRom.alpha(0.5));

const pathString = pathGenerator(points);

// Render the path so the user can see it
const path = svg.append('path')
  .attr('d', pathString)
  .attr('fill', 'none')
  .attr('stroke', '#ccc')
  .attr('stroke-width', 3)
  .attr('stroke-dasharray', '5,10');

// Add the bee image
const bee = svg.append('image')
  .attr('href', 'bee.svg')
  .attr('width', beeSize)
  .attr('height', beeSize);

const pathNode = path.node();
const totalLength = pathNode.getTotalLength();

// Helper to calculate rotation based on path derivative
function getRotation(t, startLength, endLength) {
  const currentLength = startLength + t * (endLength - startLength);
  const p0 = pathNode.getPointAtLength(Math.max(0, currentLength - 1));
  const p1 = pathNode.getPointAtLength(Math.min(totalLength, currentLength + 1));
  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI);
  return angle;
}

// Start moving the bee along the first half of the path
bee.transition()
  .duration(2000)
  .ease(d3.easeCubicInOut)
  .attrTween("transform", function() {
    return function(t) {
      // t goes from 0 to 1. Animate from length 0 to totalLength/2
      const currentLength = t * (totalLength / 2);
      const point = pathNode.getPointAtLength(currentLength);
      const angle = getRotation(t, 0, totalLength/2);
      
      return `translate(${point.x - beeSize/2}, ${point.y - beeSize/2}) rotate(${angle}, ${beeSize/2}, ${beeSize/2})`;
    };
  })
  .on("end", function() {
    // 1. Pause animation (stop at the middle for 1.5 seconds)
    // 2. Continue animation to the end of the path
    d3.select(this)
      .transition()
      .delay(1500) // Pause time before continuing
      .duration(2000)
      .ease(d3.easeCubicInOut)
      .attrTween("transform", function() {
        return function(t) {
          // Interpolate from midway to the end of the path
          const currentLength = (totalLength / 2) + t * (totalLength / 2);
          const point = pathNode.getPointAtLength(currentLength);
          const angle = getRotation(t, totalLength/2, totalLength);

          return `translate(${point.x - beeSize/2}, ${point.y - beeSize/2}) rotate(${angle}, ${beeSize/2}, ${beeSize/2})`;
        };
      });
  });
