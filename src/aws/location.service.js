const { SearchPlaceIndexForTextCommand, GetMapTileCommand } = require('@aws-sdk/client-location');
const { getLocationClient } = require('./clients');
const { env } = require('../config/env');
const logger = require('../utils/logger');

/**
 * Integración con Amazon Location Service.
 */
class LocationService {
  constructor() {
    this.client = getLocationClient();
    this.placeIndex = env.location.placeIndex;
    this.mapName = env.location.mapName;
  }

  async searchPlaces(text, maxResults = 5) {
    if (!this.placeIndex) {
      logger.debug('Location place index not configured');
      return [];
    }

    try {
      const result = await this.client.send(
        new SearchPlaceIndexForTextCommand({
          IndexName: this.placeIndex,
          Text: text,
          MaxResults: maxResults,
        }),
      );
      return (result.Results || []).map((item) => ({
        label: item.Place?.Label,
        latitude: item.Place?.Geometry?.Point?.[1],
        longitude: item.Place?.Geometry?.Point?.[0],
      }));
    } catch (error) {
      logger.error('Location search failed', { error: error.message });
      return [];
    }
  }

  async getMapTile(z, x, y) {
    if (!this.mapName) {
      logger.debug('Location map name not configured');
      return null;
    }

    try {
      const result = await this.client.send(
        new GetMapTileCommand({
          MapName: this.mapName,
          Z: parseInt(z, 10),
          X: parseInt(x, 10),
          Y: parseInt(y, 10),
        }),
      );

      // Result may contain Body or Blob depending on SDK; normalize to Buffer.
      const body = result.Blob || result.Body || result.BodyReadableStream || null;
      let buffer = null;
      if (body == null) buffer = null;
      else if (Buffer.isBuffer(body)) buffer = body;
      else if (body instanceof Uint8Array) buffer = Buffer.from(body);
      else if (typeof body === 'string') buffer = Buffer.from(body, 'base64');
      else if (body && typeof body.arrayBuffer === 'function') {
        // For streams with arrayBuffer().
        const arr = await body.arrayBuffer();
        buffer = Buffer.from(arr);
      }

      return {
        contentType: result.ContentType || 'image/png',
        data: buffer,
      };
    } catch (error) {
      logger.error('GetMapTile failed', { error: error.message });
      return null;
    }
  }
}

module.exports = new LocationService();
