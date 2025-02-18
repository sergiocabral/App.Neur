export enum TIMEFRAME {
    DAY = 'one day',
    WEEK = 'one week, weekly',
    TWO_WEEKS = 'two weeks',
    MONTH = 'one month, monthly',
    THREE_MONTHS = 'three months',
    SIX_MONTHS = 'six months, half year',
    YEAR = 'one year',
    MAX = 'max'
}

export class Timeframe {
    static timeframeToCgTimeframe(timeframe: TIMEFRAME): string {
        switch (timeframe) {
            case TIMEFRAME.DAY:
                return '1';
            case TIMEFRAME.WEEK:
                return '7';
            case TIMEFRAME.TWO_WEEKS:
                return '14';
            case TIMEFRAME.MONTH:
                return '30';
            case TIMEFRAME.THREE_MONTHS:
                return '90';
            case TIMEFRAME.SIX_MONTHS:
                return '180';
            case TIMEFRAME.YEAR:
                    return '365';
            case TIMEFRAME.MAX:
                return 'max';
        }
    }

    static timeframeToDisplay(timeframe: TIMEFRAME): string {
        switch (timeframe) {
            case TIMEFRAME.DAY:
                return '1D';
            case TIMEFRAME.WEEK:
                return '1W';
            case TIMEFRAME.TWO_WEEKS:
                return '2W';
            case TIMEFRAME.MONTH:
                return '1M';
            case TIMEFRAME.THREE_MONTHS:
                return '3M';
            case TIMEFRAME.SIX_MONTHS:
                return '6M';
            case TIMEFRAME.YEAR:
                return '1Y';
            case TIMEFRAME.MAX:
                return 'Max';
        }
    }
}