#!/usr/bin/env node

import tilebelt from "@mapbox/tilebelt";
import { VectorTile } from "@mapbox/vector-tile";
import Pbf from "pbf";

// Constants
const DEFAULT_ZOOM = 14;
const TILE_BASE_URL = "https://tunnel.optgeo.org/martin/protomaps-basemap";
const EARTH_RADIUS_M = 6371000; // Earth radius in meters

// 16 compass directions
const DIRECTIONS_16 = [
  "N", "NNE", "NE", "ENE",
  "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW",
  "W", "WNW", "NW", "NNW"
];

/**
 * Convert angle in degrees to 16-direction compass label
 */
function angleToDirection16(degrees) {
  // Normalize to 0-360
  const normalized = ((degrees % 360) + 360) % 360;
  // Each direction covers 22.5 degrees (360/16)
  const index = Math.round(normalized / 22.5) % 16;
  return DIRECTIONS_16[index];
}

/**
 * Calculate bearing (angle) from point1 to point2 in degrees
 */
function calculateBearing(from, to) {
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const dLon = (to.lon - from.lon) * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Calculate distance between two locations using Haversine formula
 */
function calculateDistance(from, to) {
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const dLat = lat2 - lat1;
  const dLon = (to.lon - from.lon) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Get 9 tiles around a location (3x3 grid centered on location)
 */
function get9Tiles(lon, lat, zoom) {
  const centerTile = tilebelt.pointToTile(lon, lat, zoom);
  const [x, y, z] = centerTile;
  
  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push([x + dx, y + dy, z]);
    }
  }
  
  return tiles;
}

/**
 * Fetch and parse a vector tile
 */
async function fetchVectorTile(tile) {
  const [x, y, z] = tile;
  const url = `${TILE_BASE_URL}/${z}/${x}/${y}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch tile ${z}/${x}/${y}: ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const pbf = new Pbf(new Uint8Array(arrayBuffer));
    return new VectorTile(pbf);
  } catch (error) {
    console.error(`Error fetching tile ${z}/${x}/${y}:`, error.message);
    return null;
  }
}

/**
 * Convert tile pixel coordinates to lon/lat
 */
function tilePixelToLonLat(tileX, tileY, zoom, pixelX, pixelY, extent = 4096) {
  const bbox = tilebelt.tileToBBOX([tileX, tileY, zoom]);
  const [west, south, east, north] = bbox;
  
  const lon = west + (east - west) * (pixelX / extent);
  const lat = north - (north - south) * (pixelY / extent);
  
  return { lon, lat };
}

/**
 * Extract features from a vector tile layer
 */
function processLayerFeatures(
  layer,
  tileX,
  tileY,
  zoom,
  currentLocation,
  featureType
) {
  const features = [];
  
  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i);
    const geometry = feature.loadGeometry();
    
    if (geometry.length === 0) continue;
    
    // Calculate center of feature
    let sumX = 0, sumY = 0, count = 0;
    for (const ring of geometry) {
      for (const point of ring) {
        sumX += point.x;
        sumY += point.y;
        count++;
      }
    }
    
    if (count === 0) continue;
    
    const centerPixel = { x: sumX / count, y: sumY / count };
    const featureLocation = tilePixelToLonLat(tileX, tileY, zoom, centerPixel.x, centerPixel.y);
    
    const distance = calculateDistance(currentLocation, featureLocation);
    const bearing = calculateBearing(currentLocation, featureLocation);
    const direction = angleToDirection16(bearing);
    
    features.push({
      direction,
      distance,
      type: featureType,
      properties: feature.properties || {}
    });
  }
  
  return features;
}

/**
 * Process vector tiles and extract spatial features
 */
async function processTiles(tiles, currentLocation) {
  const allFeatures = [];
  
  for (const tile of tiles) {
    const vectorTile = await fetchVectorTile(tile);
    if (!vectorTile) continue;
    
    const [tileX, tileY, zoom] = tile;
    
    // Process landuse layer
    if (vectorTile.layers.landuse) {
      const features = processLayerFeatures(
        vectorTile.layers.landuse,
        tileX,
        tileY,
        zoom,
        currentLocation,
        "landuse"
      );
      allFeatures.push(...features);
    }
    
    // Process building layer
    if (vectorTile.layers.building) {
      const features = processLayerFeatures(
        vectorTile.layers.building,
        tileX,
        tileY,
        zoom,
        currentLocation,
        "building"
      );
      allFeatures.push(...features);
    }
  }
  
  return allFeatures;
}

/**
 * Generate summary by direction
 */
function generateSummary(features) {
  const byDirection = {};
  
  for (const direction of DIRECTIONS_16) {
    byDirection[direction] = {
      landuse: {},
      buildings: 0
    };
  }
  
  for (const feature of features) {
    if (!byDirection[feature.direction]) continue;
    
    if (feature.type === "landuse") {
      const landuseType = feature.properties.landuse || feature.properties.class || "unknown";
      byDirection[feature.direction].landuse[landuseType] = 
        (byDirection[feature.direction].landuse[landuseType] || 0) + 1;
    } else if (feature.type === "building") {
      byDirection[feature.direction].buildings++;
    }
  }
  
  return byDirection;
}

/**
 * Format distance for display
 */
function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

/**
 * Generate markdown output
 */
function generateMarkdown(description) {
  const lines = [];
  
  lines.push("# Subjective Spatial Description");
  lines.push("");
  lines.push(`**Location**: ${description.location.lat.toFixed(6)}, ${description.location.lon.toFixed(6)}`);
  lines.push(`**Zoom Level**: ${description.zoom}`);
  lines.push("");
  
  // Group features by direction
  const featuresByDirection = {};
  for (const feature of description.features) {
    if (!featuresByDirection[feature.direction]) {
      featuresByDirection[feature.direction] = [];
    }
    featuresByDirection[feature.direction].push(feature);
  }
  
  // Sort directions
  const directions = Object.keys(featuresByDirection).sort((a, b) => {
    return DIRECTIONS_16.indexOf(a) - DIRECTIONS_16.indexOf(b);
  });
  
  lines.push("## Spatial Features by Direction");
  lines.push("");
  
  for (const direction of directions) {
    const dirFeatures = featuresByDirection[direction];
    const buildings = dirFeatures.filter(f => f.type === "building");
    const landuses = dirFeatures.filter(f => f.type === "landuse");
    
    if (buildings.length === 0 && landuses.length === 0) continue;
    
    // Calculate density in 100m radius
    const buildingsIn100m = buildings.filter(f => f.distance <= 100).length;
    
    // Find closest features
    const closestFeatures = dirFeatures
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    
    const parts = [];
    
    // Add landuse info
    const landuseTypes = {};
    for (const feature of landuses) {
      const type = feature.properties.landuse || feature.properties.class || "unknown";
      landuseTypes[type] = (landuseTypes[type] || 0) + 1;
    }
    
    const landuseStr = Object.entries(landuseTypes)
      .map(([type, count]) => count > 1 ? `${type} (${count})` : type)
      .join(", ");
    
    if (landuseStr) {
      parts.push(landuseStr);
    }
    
    // Add building density
    if (buildingsIn100m > 0) {
      parts.push(`${buildingsIn100m}+ bldgs in 100m`);
    } else if (buildings.length > 0) {
      const avgDistance = buildings.reduce((sum, b) => sum + b.distance, 0) / buildings.length;
      parts.push(`${buildings.length} bldgs ~${formatDistance(avgDistance)}`);
    }
    
    if (parts.length > 0) {
      const closestDist = closestFeatures.length > 0 ? 
        formatDistance(closestFeatures[0].distance) : "";
      lines.push(`**[${direction}]** ${closestDist}: ${parts.join(" | ")}`);
    }
  }
  
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total features: ${description.features.length}`);
  lines.push(`- Buildings: ${description.features.filter(f => f.type === "building").length}`);
  lines.push(`- Landuse features: ${description.features.filter(f => f.type === "landuse").length}`);
  
  return lines.join("\n");
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error("Usage: node main.mjs <longitude> <latitude> [zoom]");
    console.error("Example: node main.mjs 139.7671 35.6812 14");
    process.exit(1);
  }
  
  const lon = parseFloat(args[0]);
  const lat = parseFloat(args[1]);
  const zoom = args.length > 2 ? parseInt(args[2]) : DEFAULT_ZOOM;
  
  if (isNaN(lon) || isNaN(lat) || isNaN(zoom)) {
    console.error("Invalid arguments. Longitude, latitude, and zoom must be numbers.");
    process.exit(1);
  }
  
  const currentLocation = { lon, lat };
  
  console.error(`Generating spatial description for location: ${lat}, ${lon} at zoom ${zoom}...`);
  
  // Get 9 tiles around the location
  const tiles = get9Tiles(lon, lat, zoom);
  console.error(`Fetching ${tiles.length} tiles...`);
  
  // Process tiles and extract features
  const features = await processTiles(tiles, currentLocation);
  console.error(`Extracted ${features.length} features`);
  
  // Generate summary
  const summary = generateSummary(features);
  
  // Create spatial description
  const description = {
    location: currentLocation,
    zoom,
    features,
    summary: { byDirection: summary }
  };
  
  // Generate and output markdown
  const markdown = generateMarkdown(description);
  console.log(markdown);
}

// Run main function
main().catch(error => {
  console.error("Error:", error);
  process.exit(1);
});
