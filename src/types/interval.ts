export enum INTERVAL {
  DAYS = 'days',
  HOURS = 'hours',
  MINUTES = 'minutes',
}

export class Interval {
  static mapIntervalToCgInterval(interval: INTERVAL): string {
    switch (interval) {
      case INTERVAL.DAYS:
        return 'daily';
      case INTERVAL.HOURS:
        return 'hourly';
      default:
        return 'hourly';
    }
  }

  static mapIntervalToDexPath(interval: INTERVAL): string {
    switch (interval) {
      case INTERVAL.DAYS:
        return 'day';
      case INTERVAL.HOURS:
        return 'hour';
      case INTERVAL.MINUTES:
        return 'minute';
      default:
        return 'minute';
    }
  }

  static mapIntervalToDisplay(interval: INTERVAL): string {
    switch (interval) {
      case INTERVAL.DAYS:
        return 'Daily';
      case INTERVAL.HOURS:
        return 'Hourly';
      case INTERVAL.MINUTES:
        return 'Minute';
      default:
        return 'Minute';
    }
  }

  static validateAggregator(interval: INTERVAL, aggregator?: string): string {
    const agg = aggregator ?? '1';

    if (interval === INTERVAL.DAYS && agg !== '1') {
      console.warn(`Invalid aggregator '${agg}' for DAYS. Defaulting to '1'.`);
      return '1';
    }
    if (interval === INTERVAL.HOURS && !['1', '4', '12'].includes(agg)) {
      console.warn(`Invalid aggregator '${agg}' for HOURS. Defaulting to '1'.`);
      return '1';
    }
    if (interval === INTERVAL.MINUTES && !['1', '5', '15'].includes(agg)) {
      console.warn(
        `Invalid aggregator '${agg}' for MINUTES. Defaulting to '1'.`,
      );
      return '1';
    }

    return agg;
  }
}
