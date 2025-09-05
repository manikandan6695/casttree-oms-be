import { Injectable } from '@nestjs/common';
import { parse } from 'json2csv';

@Injectable()
export class MixpanelExportService {
  convertJsonlToCsv(jsonlString: string): string {
    try {
      // Split JSONL into individual JSON objects
      const lines = jsonlString.trim().split('\n');
      const jsonArray = lines.map(line => JSON.parse(line));

      // Include all properties as JSON string
      const flattened = jsonArray.map(item => ({
        event: item.event,
        time: item.properties?.time,
        distinct_id: item.properties?.distinct_id,
        properties: JSON.stringify(item.properties || {}),
      }));

      // Convert to CSV
      const csv = parse(flattened, { flatten: true });
      return csv;
    } catch (error) {
      console.error('Error converting JSONL to CSV:', error);
      throw new Error('Failed to convert JSONL to CSV');
    }
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getDefaultDateRange(): { fromDate: string; toDate: string } {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    return {
      fromDate: this.formatDate(sevenDaysAgo),
      toDate: this.formatDate(today)
    };
  }

}
