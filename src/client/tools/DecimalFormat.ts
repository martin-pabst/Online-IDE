type RoundingMode = "UP" | "DOWN" | "CEILING" | "FLOOR" | "HALF_UP" | "HALF_DOWN" | "HALF_EVEN";

class Pattern {
    positivePraefix: string = "";
    positiveSuffix: string = "";
    negativePraefix: string = "";
    negativeSuffix: string = "";
    multiplier: number = 1;         // used in percent/promille format
    groupingSize: number = 0;
    minimumIntegerDigits: number = 0;
    minimumFractionDigits: number = 0;
    maximumFractionDigits: number = 0;
    minimumExponent: number = 0;
    maximumIntegerDigits: number = 10000;
    roundingMode: RoundingMode = "HALF_EVEN";
}

class DecimalFormat {

    format: string;
    position: number;

    pattern: Pattern = new Pattern();

    parsePositiveOrNegativePattern: "positive" | "negative" = "positive";
    

    private applyPattern(format: string){
        this.format = format;
        this.position = 0;

        this.pattern = new Pattern();
        this.parsePositiveOrNegativePattern = "positive";

        this.parsePattern();
        if(this.comes(";", true)){
            let positivePattern = this.pattern;
            this.pattern = new Pattern();
            this.parsePositiveOrNegativePattern = "negative";
            this.parsePattern();
            positivePattern.negativePraefix = this.pattern.positivePraefix;
            positivePattern.negativeSuffix = this.pattern.positiveSuffix;
            this.pattern = positivePattern;
        }  else {
            this.pattern.negativePraefix = "-" + this.pattern.positivePraefix;
            this.pattern.negativeSuffix = this.pattern.positiveSuffix;
        }
    }

    private comes(token: string, skip: boolean = true): boolean {
        let ret = this.format.indexOf(token, this.position) == 0;
        if(ret && skip) this.position += token.length;
        return ret;
    }

    private parsePattern(): void {
        this.parsePraefix();
        this.parseNumber();
        this.parseSuffix();    
    }

    private parsePraefix(){

        let c: string = this.getNextCharacter(false);
        while("0#".indexOf(c) < 0 && !this.isEnd()){
            this.position++;
            switch(c){
                case "'": c = this.getNextCharacter(true); break;
                case "%": this.pattern.multiplier = 100; break;
                case "\u2030": this.pattern.multiplier = 1000; break;
            }
            this.pattern.positivePraefix += c;
            c = this.getNextCharacter(false);
        }

    }

    private parseSuffix(){

        let c: string = this.getNextCharacter(true);
        while(!this.isEnd()){
            switch(c){
                case "'": c = this.getNextCharacter(true); break;
                case "%": this.pattern.multiplier = 100; break;
                case "\u2030": this.pattern.multiplier = 1000; break;
            }
            this.pattern.positiveSuffix += c;
            c = this.getNextCharacter(true);
        }

    }


    private parseNumber(){
        this.parseInteger();
        if(this.comes('.', true)) this.parseFraction();
        if(this.comes('E', true)) this.parseExponent(); 
    }

    private parseInteger(){
        let integerGrouping = 0;
        while(this.comes("#", false)){
            while(this.comes("#", true)) integerGrouping++;
            if(this.comes(",", true)){
                this.pattern.groupingSize = integerGrouping;
                integerGrouping = 0;
                continue;
            }
            break;
        }
        while(this.comes("0", false)){
            while(this.comes("0", true)){
                integerGrouping++;
                this.pattern.minimumIntegerDigits++;
            } 
            if(this.comes(",", true)){
                this.pattern.groupingSize = integerGrouping;
                integerGrouping = 0;
                continue;
            }
            break;
        }
    }

    parseFraction(){
        while(this.comes("0", true)) this.pattern.minimumFractionDigits++;
        this.pattern.maximumFractionDigits = this.pattern.minimumFractionDigits;
        while(this.comes("#", true)) this.pattern.maximumFractionDigits++;
    }
    
    parseExponent(){
        while(this.comes("0", true)) this.pattern.minimumExponent++;
    }

    isEnd(): boolean {
        return this.position >= this.format.length;
    }

    getNextCharacter(skip: boolean = true): string {
        if(this.isEnd()) return "\uFFFF";
        let ret = this.format.charAt(this.position);
        if(skip) this.position++;
        return ret;
    }


}