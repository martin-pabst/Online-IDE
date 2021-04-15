import { TokenType } from "../../compiler/lexer/Token.js";
import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { Enum, EnumRuntimeObject } from "../../compiler/types/Enum.js";
import { intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";

export type LocalDateTimeIntrinsicData = {
    date: Date
}

export class LocalDateTimeClass extends Klass {

    constructor(module: Module) {

        super("LocalDateTime", module, "Ein LocalDate-Objekt speichert einen Zeitpunkt (Datum und Uhrzeit).");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
        let dayOfWeekType = <Enum>module.typeStore.getType("DayOfWeek");
        let MonthType = <Enum>module.typeStore.getType("Month");

        // this.staticClass.classObject = new RuntimeObject(this.staticClass);
        // this.staticClass.classObject.initializeAttributeValues();
        
        this.addMethod(new Method("LocalDateTime", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                var today = new Date();

                let intrinsicData: LocalDateTimeIntrinsicData = {
                    date: today
                };

                o.intrinsicData["ldt"] = intrinsicData;

                return;

            }, false, false, 'Holt den aktuellen Zeitpunkt von der Systemuhr des Rechners und gibt ihn als LocalDateTime-Objekt zurück.'
            , true));


        this.addMethod(new Method("now", new Parameterlist([]), this,
            (parameters) => {

                let o: RuntimeObject = new RuntimeObject(this);

                var today = new Date();

                let intrinsicData: LocalDateTimeIntrinsicData = {
                    date: today
                };

                o.intrinsicData["ldt"] = intrinsicData;

                return o;

            }, false, true, 'Holt den aktuellen Zeitpunkt von der Systemuhr des Rechners und gibt ihn als LocalDateTime-Objekt zurück.'
            , false));

        this.addMethod(new Method("of", new Parameterlist([
            { identifier: "year", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "month", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "dayOfMonth", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "hour", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "minute", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "second", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },

        ]), this,
            (parameters) => {

                let o: RuntimeObject = new RuntimeObject(this);
                let year: number = Math.trunc(parameters[1].value);
                let month: number = Math.trunc(parameters[2].value);
                let dayOfMonth: number = Math.trunc(parameters[3].value);
                let hour: number = Math.trunc(parameters[4].value);
                let minute: number = Math.trunc(parameters[5].value);
                let second: number = Math.trunc(parameters[6].value);

                var date = new Date(year, month - 1, dayOfMonth, hour, minute, second);

                let intrinsicData: LocalDateTimeIntrinsicData = {
                    date: date
                };

                o.intrinsicData["ldt"]= intrinsicData;

                return o;

            }, false, true, 'Gibt ein LocalDateTime-Objekt zurück, das den durch year, month (1 - 12), dayOfMonth, hour, minute, second beschriebenen Zeitpunkt repräsentiert.'
            , false));

        this.addMethod(new Method("of", new Parameterlist([
            { identifier: "year", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "month", type: MonthType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "dayOfMonth", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "hour", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "minute", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "second", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },

        ]), this,
            (parameters) => {

                let o: RuntimeObject = new RuntimeObject(this);
                let year: number = Math.trunc(parameters[1].value);
                let month: EnumRuntimeObject = parameters[2].value;
                let dayOfMonth: number = Math.trunc(parameters[3].value);
                let hour: number = Math.trunc(parameters[4].value);
                let minute: number = Math.trunc(parameters[5].value);
                let second: number = Math.trunc(parameters[6].value);

                var date = new Date(year, month.enumValue.ordinal, dayOfMonth, hour, minute, second);

                let intrinsicData: LocalDateTimeIntrinsicData = {
                    date: date
                };

                o.intrinsicData["ldt"] = intrinsicData;

                return o;

            }, false, true, 'Gibt ein LocalDateTime-Objekt zurück, das den durch year, month (1 - 12), dayOfMonth, hour, minute, second beschriebenen Zeitpunkt repräsentiert.'
            , false));

        this.addMethod(new Method("plusDays", new Parameterlist([
            { identifier: "days", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), this,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let days: number = Math.trunc(parameters[1].value);

                let oldDate: Date = (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date;
                let newDate: Date = new Date(oldDate.getTime() + days*24*3600*1000);

                let o1: RuntimeObject = new RuntimeObject(this);

                let intrinsicData: LocalDateTimeIntrinsicData = {
                    date: newDate
                };

                o1.intrinsicData["ldt"] = intrinsicData;

                return o1;

            }, false, false, 'Gibt ein neues LocalDateTime-Objekt zurück, das einen Zeitpunkt repräsentiert, der um die übergebene Anzahl von Tagen später liegt.', false));

        this.addMethod(new Method("minusDays", new Parameterlist([
            { identifier: "days", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), this,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let days: number = Math.trunc(parameters[1].value);

                let oldDate: Date = (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date;
                let newDate: Date = new Date(oldDate.getTime() - days*24*3600*1000);

                let o1: RuntimeObject = new RuntimeObject(this);

                let intrinsicData: LocalDateTimeIntrinsicData = {
                    date: newDate
                };

                o1.intrinsicData["ldt"] = intrinsicData;

                return o1;

            }, false, false, 'Gibt ein neues LocalDateTime-Objekt zurück, das einen Zeitpunkt repräsentiert, der um die übergebene Anzahl von Tagen früher liegt.', false));

        this.addMethod(new Method("compareTo", new Parameterlist([
            { identifier: "date", type: this, declaration: null, usagePositions: null, isFinal: true },
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let o1: RuntimeObject = parameters[1].value;

                let oldMs: number = (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date.getTime();
                let newMs: number = (<LocalDateTimeIntrinsicData>(o1.intrinsicData["ldt"])).date.getTime();

                return Math.sign(oldMs - newMs);

            }, false, false, 'Gibt 1 zurück, falls das Datum größer ist als das übergebene, 0, falls sie gleich sind und -1, falls das Datum kleiner ist als das übergebene.', false));

        this.addMethod(new Method("until", new Parameterlist([
            { identifier: "date", type: this, declaration: null, usagePositions: null, isFinal: true },
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let o1: RuntimeObject = parameters[1].value;

                let oldMs: number = (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date.getTime();
                let newMs: number = (<LocalDateTimeIntrinsicData>(o1.intrinsicData["ldt"])).date.getTime();

                return (oldMs - newMs)/(24*3600);

            }, false, false, 'Gibt zurück, wie viele Tage (gerundet) zwischen den beiden Zeitpunkten liegen.', false));

        this.addMethod(new Method("getYear", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date.getFullYear();

            }, false, false, 'Gibt das Jahr zurück.', false));

        this.addMethod(new Method("getMonthValue", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date.getMonth() + 1;

            }, false, false, 'Gibt den Monat als Zahl zurück (Januar == 1, Februar == 2, ..., Dezember == 12).', false));

        this.addMethod(new Method("getDayOfMonth", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date.getDate();

            }, false, false, 'Gibt den Tag innerhalb des Monats zurück (Zahl von 1 bis 31).', false));

        this.addMethod(new Method("getHour", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date.getHours();

            }, false, false, 'Gibt die Stunde innerhalb des Tages zurück.', false));

        this.addMethod(new Method("getMinute", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date.getMinutes();

            }, false, false, 'Gibt die Minute zurück.', false));

        this.addMethod(new Method("getSecond", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date.getSeconds();

            }, false, false, 'Gibt die Sekunde zurück.', false));

        this.addMethod(new Method("toString", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                let date = (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date;

                let td = (value: number) => {
                    if(value < 10) return "0" + value;
                    return "" + value;
                }

                return `${td(date.getDate())}.${td(date.getMonth() + 1)}.${td(date.getFullYear())} ${td(date.getHours())}:${td(date.getMinutes())}:${td(date.getSeconds())}`;

            }, false, false, 'Gibt den Wert in der Form 12.03.2007 10:15:30 zurück.', false));

        this.addMethod(new Method("getDayOfWeek", new Parameterlist([
        ]), dayOfWeekType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                let dow = (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date.getDay();
                return dayOfWeekType.enumInfoList[dow - 1].object;

            }, false, false, 'Gibt die den Wochentag zurück. Falls Du ihn als Zahl (0 == Montag, ...) benötigst, nutze getDayOfWeek().toOrdinal(). ', false));

        this.addMethod(new Method("getMonth", new Parameterlist([
        ]), MonthType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                let monthIndex = (<LocalDateTimeIntrinsicData>(o.intrinsicData["ldt"])).date.getMonth();
                return MonthType.enumInfoList[monthIndex].object;

            }, false, false, 'Gibt die den Monat zurück. Falls Du ihn als Zahl (1 == Januar, ...) benötigst, nutze getMonthValue()', false));


    }

}

export class DayOfWeekEnum extends Enum {

    constructor(module: Module) {
        super("DayOfWeek", module, [
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Montag"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Dienstag"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Mittwoch"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Donnerstag"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Freitag"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Samstag"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Sonntag"
            },
        ]);

        this.documentation = "Wochentag"
    }
}

export class MonthEnum extends Enum {

    constructor(module: Module) {
        super("Month", module, [
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Januar"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Februar"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "März"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "April"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Mai"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Juni"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Juli"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "August"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Septemter"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Oktober"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "November"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "Dezember"
            },
        ]);

        this.documentation = "Monat"
    }
}