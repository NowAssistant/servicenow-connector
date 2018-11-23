const api = require('./api');

module.exports = async activity => {
    try {
        api.initialize(activity);
 
        const response = await api('/incident');

        activity.Response.Data.items = [];

        for (let i = 0; i < response.body.result.length; i++) {
            activity.Response.Data.items.push(
                convert_item(
                    response.body.result[i]
                )
            );
        }

        activity.Response.Data.items.sort(dateDescending);
    } catch (error) {
        var m = error.message;  

        if (error.stack) {
            m = m + ": " + error.stack;
        }

        activity.Response.ErrorCode = 
            (error.response && error.response.statusCode) || 500;

        activity.Response.Data = {
            ErrorText: m
        };
    }

    function convert_item(_item) {
        return {
            id: _item.number,
            title: _item.short_description,
            description: _item.description,
            date: convert_date(_item.opened_at)
        };
    }

    function convert_date(_date) {
        _date = _date
            .replace(/[^0-9]/g, '_')
            .split('_');

        const date = new Date(
            _date[0],
            _date[1] - 1,
            _date[2],
            _date[3],
            _date[4],
            _date[5]
        );

        return date.toISOString();
    }

    const dateDescending = (a, b) => {
        a = new Date(a.date);
        b = new Date(b.date);
            
        return a > b ? -1 : (a < b ? 1 : 0);
    }
};
