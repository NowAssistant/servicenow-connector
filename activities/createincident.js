const api = require('./common/api');

module.exports = async activity => {
    try {
        api.initialize(activity);

        if (process.env.NODE_ENV = 'development') {
            activity.Request.Query = {
                short_description: "Test incident creation through REST",
                comments: "These are my comments"
            }
        }

        if (activity.Request.Query) {
            const opts = {
                method: 'POST',
                body: activity.Request.Query
            };

            const response = await api('/incident', opts);
          
            activity.Response.Data.item = response.body.result;
        } else {
            activity.Response.ErrorCode = 400;
            activity.Response.Data = {
                ErrorText: 'Bad request: no query body provided'
            }
        }
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
};
