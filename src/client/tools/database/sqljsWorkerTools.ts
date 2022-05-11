function createDb(SQL, buffer) {

    db = new SQL.Database(buffer);

    db.create_function("isDate", function (inputText) {

        if(inputText == null) return true;
        if (typeof inputText != 'string') return false;

        // var dateformat = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
        var dateformat = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/;
        // Match the date format through regular expression
        if (inputText.match(dateformat)) {
            //Test which seperator is used '/' or '-'
            var opera1 = inputText.split('/');
            var opera2 = inputText.split('-');
            var lopera1 = opera1.length;
            var lopera2 = opera2.length;
            // Extract the string into month, date and year
            if (lopera1 > 1) {
                var pdate = inputText.split('/');
            }
            else if (lopera2 > 1) {
                var pdate = inputText.split('-');
            }
            if (pdate.length != 3) return false;
            var dd = parseInt(pdate[2]);
            var mm = parseInt(pdate[1]);
            var yy = parseInt(pdate[0]);
            // Create list of days of a month [assume there is no leap year by default]
            var ListofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (mm == 1 || mm > 2) {
                if (dd > ListofDays[mm - 1]) {
                    return false;
                }
            }
            if (mm == 2) {
                var lyear = false;
                if ((!(yy % 4) && yy % 100) || !(yy % 400)) {
                    lyear = true;
                }
                if ((lyear == false) && (dd >= 29)) {
                    return false;
                }
                if ((lyear == true) && (dd > 29)) {
                    return false;
                }
                return true;
            }

            return true;

        }
        else {
            return false;
        }
    });

    db.create_function("isDateTime", function (inputText) {
        if(inputText == null) return true;
        
        if (typeof inputText != 'string') return false;

        // var dateformat = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
        var dateformat = /^\d{4}[\-](0[1-9]|1[012])[\-](0[1-9]|[12][0-9]|3[01]) ([01][1-9]|2[0123]):([0-5][0-9]):([0-5][0-9])$/;
        // Match the date format through regular expression
        if (inputText.match(dateformat)) {
            var splitStr = inputText.split(' ');
            var dateStr = splitStr[0];
            //var timeStr = splitStr[1];

            // if (dateStr.length != 3) return false;
            // var dd = parseInt(dateStr[2]);
            // var mm = parseInt(dateStr[1]);
            // var yy = parseInt(dateStr[0]);
            if (dateStr.length != 10) return false;
            var dd = parseInt(dateStr.substring(8,10));
            var mm = parseInt(dateStr.substring(5, 7));
            var yy = parseInt(dateStr.substring(0, 4));
              // Create list of days of a month [assume there is no leap year by default]
            var ListofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (mm == 1 || mm > 2) {
                if (dd > ListofDays[mm - 1]) {
                    return false;
                }
            }
            if (mm == 2) {
                var lyear = false;
                if ((!(yy % 4) && yy % 100) || !(yy % 400)) {
                    lyear = true;
                }
                if ((lyear == false) && (dd >= 29)) {
                    return false;
                }
                if ((lyear == true) && (dd > 29)) {
                    return false;
                }
                return true;
            }

            return true;

        }
        else {
            return false;
        }
    });
    return db;
}

