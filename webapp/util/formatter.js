sap.ui.define([

], function () {
    'use strict';
    return {
        getStatus: function (status) {
            switch (status) {
                case "ACTIVE":
                    return 'Success'
                    break;
                case "INACTIVE":
                    return 'Information'
                    break;
                default:
                    break;
            }
        },
        getFormatedDate: function (input) {
            if (input === '00000000') {
                return '-'
            }
            let year = input.substring(0, 4);
            let month = input.substring(4, 6);
            let day = input.substring(6, 8);
            let format2 = `${day}/${month}/${year}`; // 25/03/2025
            return format2;

        }

    }
})