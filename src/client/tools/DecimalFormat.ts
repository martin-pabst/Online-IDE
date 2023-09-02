type RoundingMode = "UP" | "DOWN" | "CEILING" | "FLOOR" | "HALF_UP" | "HALF_DOWN" | "HALF_EVEN";


class Pattern {
    positivePraefix: string = "";
    positiveSuffix: string = "";
    negativePraefix: string = "";
    negativeSuffix: string = "";
    multiplier: number = 1;         // used in percent/promille format
    groupingSize: number = 0;
    minimumIntegerDigits: number = 0;
    maximumIntegerDigits: number = 16;
    minimumFractionDigits: number = 0;
    maximumFractionDigits: number = 0;
    minimumExponentDigits: number = 0;
    roundingMode: RoundingMode = "HALF_EVEN";
}

export class DecimalFormat {

    position: number;

    pattern: Pattern = new Pattern();

    parsePositiveOrNegativePattern: "positive" | "negative" = "positive";

    private static stringWithNulls: string = "0000000000000000000000000000000000000000";

    constructor(private formatString: string = '00.00'){
        this.parseFormatString(formatString);
    }

    private parseFormatString(format: string) {
        this.formatString = format;
        this.position = 0;

        this.pattern = new Pattern();
        this.parsePositiveOrNegativePattern = "positive";

        this.parsePattern();
        if (this.comes(";", true)) {
            let positivePattern = this.pattern;
            this.pattern = new Pattern();
            this.parsePositiveOrNegativePattern = "negative";
            this.parsePattern();
            positivePattern.negativePraefix = null;
            positivePattern.negativeSuffix = null;
            this.pattern = positivePattern;
        } else {
            this.pattern.negativePraefix = "-" + this.pattern.positivePraefix;
            this.pattern.negativeSuffix = this.pattern.positiveSuffix;
        }
    }

    public format(n: number): string {
        let s = n.toString();
        let parts = s.match(/(-)?(\d*).?(\d*)(e([+-](\d*)))?/);
        let signPart: string = parts[1];
        let integerPart: string = parts[2];
        let fractionPart: string = parts[3];
        let hasExpPart: boolean = parts[4] != null;
        let expNumberWithSignPart: string = parts[5];
        let expSignPart: string = parts[6];

        let sign = signPart == '-' ? -1 : 1;

        let retPraefix: string = '';

        if (sign == -1) {
            if (this.pattern.negativePraefix == null) {
                retPraefix = '-' + this.pattern.positivePraefix;
            } else {
                retPraefix = this.pattern.negativePraefix;
            }
        } else {
            retPraefix = this.pattern.positivePraefix;
        }

        let retExponential = '';
        
        let retInteger = '';
        let retFraction = '';
        
        let exp = integerPart.length - 1;
        if (expNumberWithSignPart != null) exp += Number.parseInt(expNumberWithSignPart);
        if (exp > this.pattern.maximumIntegerDigits) {
            // exponential view
            retExponential = integerPart.substring(0, 1) + '.' + integerPart.substring(1) + fractionPart == null ? '' : fractionPart;
            retExponential += 'E' + exp.toString();
        } else {

            if (fractionPart != null) {
                retFraction = '.';
                let neededFractionDigits = this.pattern.minimumFractionDigits - fractionPart.length;
                if (neededFractionDigits > 0) {
                    fractionPart += DecimalFormat.stringWithNulls.substring(0, neededFractionDigits);
                }

                if(this.pattern.maximumFractionDigits < fractionPart.length){
                    let fNumber: number = Number.parseInt("1" + fractionPart.substring(0, this.pattern.maximumFractionDigits));
                    let nextDigit = Number.parseInt(fractionPart.substring(this.pattern.maximumFractionDigits, this.pattern.maximumFractionDigits + 1));
                    if(nextDigit >= 5){
                        fNumber += 1;
                    }
                    let fString: string = "" + fNumber;
                    if(fString.startsWith("2")){ 
                        integerPart = "" + (Number.parseInt(integerPart) + 1);
                    }
                    fractionPart = fString.substring(1, fString.length);
                    fractionPart = fractionPart.substring(0, this.pattern.maximumFractionDigits);
                }

                retFraction += fractionPart;
            }

            let neededIntegerDigits = this.pattern.minimumIntegerDigits - integerPart.length;
            if (neededIntegerDigits > 0) {
                integerPart = DecimalFormat.stringWithNulls.substring(0, neededIntegerDigits) + integerPart;
            }

            // group integer part
            if (this.pattern.groupingSize > 0) {
                let groupedIntegerPart = "";
                let startGroup = integerPart.length;
                let endGroup = startGroup - this.pattern.groupingSize;
                while (endGroup >= 0) {
                    groupedIntegerPart = integerPart.substring(endGroup, startGroup) + groupedIntegerPart;
                    if (endGroup > 0) groupedIntegerPart = "," + groupedIntegerPart;
                    startGroup -= this.pattern.groupingSize;
                    endGroup -= this.pattern.groupingSize
                }
                if (startGroup > 0) {
                    groupedIntegerPart = integerPart.substring(0, startGroup) + groupedIntegerPart;
                }
                integerPart = groupedIntegerPart;
            }

            retInteger = integerPart;

        }

        let ret = retPraefix + retExponential + retInteger + retFraction;

        if (sign == -1 && this.pattern.negativeSuffix != null) {
            ret += this.pattern.negativeSuffix;
        } else {
            ret += this.pattern.positiveSuffix;
        }

        return ret;
    }

    private comes(token: string, skip: boolean = true): boolean {
        let ret = this.formatString.indexOf(token, this.position) == this.position;
        if (ret && skip) this.position += token.length;
        return ret;
    }

    private parsePattern(): void {
        this.parsePraefix();
        this.parseNumber();
        this.parseSuffix();
    }

    private parsePraefix() {

        let c: string = this.getNextCharacter(false);
        while ("0#".indexOf(c) < 0 && !this.isEnd()) {
            this.position++;
            switch (c) {
                case "'": c = this.getNextCharacter(true); break;
                case "%": this.pattern.multiplier = 100; break;
                case "\u2030": this.pattern.multiplier = 1000; break;
            }
            this.pattern.positivePraefix += c;
            c = this.getNextCharacter(false);
        }

    }

    private parseSuffix() {

        let c: string = this.getNextCharacter(true);
        while (!this.isEnd()) {
            switch (c) {
                case "'": c = this.getNextCharacter(true); break;
                case "%": this.pattern.multiplier = 100; break;
                case "\u2030": this.pattern.multiplier = 1000; break;
            }
            this.pattern.positiveSuffix += c;
            c = this.getNextCharacter(true);
        }

    }


    private parseNumber() {
        this.parseInteger();
        if (this.comes('.', true)) this.parseFraction();
        if (this.comes('E', true)) this.parseExponent();
    }

    private parseInteger() {
        let integerGrouping = 0;
        let groupingStarted = false;
        while (this.comes("#", false)) {
            while (this.comes("#", true)){
                if(groupingStarted) integerGrouping++;
            }  
            if (this.comes(",", true)) {
                groupingStarted = true;
                this.pattern.groupingSize = integerGrouping;
                integerGrouping = 0;
                continue;
            }
            break;
        }
        this.pattern.groupingSize = integerGrouping;

        while (this.comes("0", false)) {
            while (this.comes("0", true)) {
                integerGrouping++;
                this.pattern.minimumIntegerDigits++;
            }
            if (this.comes(",", true)) {
                this.pattern.groupingSize = integerGrouping;
                integerGrouping = 0;
                continue;
            }
            break;
        }
    }

    parseFraction() {
        while (this.comes("0", true)) this.pattern.minimumFractionDigits++;
        this.pattern.maximumFractionDigits = this.pattern.minimumFractionDigits;
        while (this.comes("#", true)) this.pattern.maximumFractionDigits++;
    }

    parseExponent() {
        while (this.comes("0", true)) this.pattern.minimumExponentDigits++;
    }

    isEnd(): boolean {
        return this.position >= this.formatString.length;
    }

    getNextCharacter(skip: boolean = true): string {
        if (this.isEnd()) return "\uFFFF";
        let ret = this.formatString.charAt(this.position);
        if (skip) this.position++;
        return ret;
    }


}