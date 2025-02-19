export enum TIME_RANGE {
  DAY = 'one day',
  WEEK = 'one week, weekly',
  TWO_WEEKS = 'two weeks',
  MONTH = 'one month, monthly',
  THREE_MONTHS = 'three months',
  SIX_MONTHS = 'six months, half year',
  YEAR = 'one year',
  MAX = 'max',
}

export class TimeRange {
  static mapTimeRangeToCgTimeRange(timeRange: TIME_RANGE): string {
    switch (timeRange) {
      case TIME_RANGE.DAY:
        return '1';
      case TIME_RANGE.WEEK:
        return '7';
      case TIME_RANGE.TWO_WEEKS:
        return '14';
      case TIME_RANGE.MONTH:
        return '30';
      case TIME_RANGE.THREE_MONTHS:
        return '90';
      case TIME_RANGE.SIX_MONTHS:
        return '180';
      case TIME_RANGE.YEAR:
        return '365';
      case TIME_RANGE.MAX:
        return 'max';
      default:
        return '30'
    }
  }

  static mapTimeRangeToDisplay(timeRange: TIME_RANGE): string {
    switch (timeRange) {
      case TIME_RANGE.DAY:
        return '1D';
      case TIME_RANGE.WEEK:
        return '1W';
      case TIME_RANGE.TWO_WEEKS:
        return '2W';
      case TIME_RANGE.MONTH:
        return '1M';
      case TIME_RANGE.THREE_MONTHS:
        return '3M';
      case TIME_RANGE.SIX_MONTHS:
        return '6M';
      case TIME_RANGE.YEAR:
        return '1Y';
      case TIME_RANGE.MAX:
        return 'Max';
      default:
        return '1M'
    }
  }
}
