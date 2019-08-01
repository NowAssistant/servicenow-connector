'use strict';
const api = require('./common/api');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

module.exports = async (activity) => {
  try {
    var data = {};

    // extract _action from Request
    var _action = getObjPath(activity.Request, "Data.model._action");
    if (_action) {
      activity.Request.Data.model._action = {};
    } else {
      _action = {};
    }

    switch (activity.Request.Path) {
      case "create":
      case "submit":
        const form = _action.form;
        api.initialize(activity);

        const userResponse = await api('/sys_user?sysparm_query=sys_id=javascript:gs.getUserID()');
        const userId = userResponse.body.result[0].sys_id;

        var response = await api.post('/incident', {
          json: true,
          body: {
              short_description: form.subject,
              description: form.description,
              urgency: form.urgency,
              caller_id: userId
          }
        });
        var comment = T(activity, "Issue {0} created", response.body.result.number);
        data = getObjPath(activity.Request, "Data.model");
        data._action = {
          response: {
            success: true,
            message: comment
          }
        };
        break;

      default:
        var fname = __dirname + path.sep + "common" + path.sep + "issue-create.form";
        var schema = yaml.safeLoad(fs.readFileSync(fname, 'utf8'));

        data.title = T(activity, "Create Issue");
        data.formSchema = schema;

        // initialize form subject with query parameter (if provided)
        if (activity.Request.Query && activity.Request.Query.query) {
          data = {
            form: {
              subject: activity.Request.Query.query
            }
          }
        }
        data._actionList = [{
          id: "create",
          label: T(activity, "Create Issue"),
          settings: {
            actionType: "a"
          }
        }];
        break;
    }

    // copy response data
    activity.Response.Data = data;
  } catch (error) {
    // handle generic exception
    $.handleError(activity, error);
  }

  function getObjPath(obj, path) {

    if (!path) return obj;
    if (!obj) return null;

    var paths = path.split('.'),
      current = obj;

    for (var i = 0; i < paths.length; ++i) {
      if (current[paths[i]] == undefined) {
        return undefined;
      } else {
        current = current[paths[i]];
      }
    }
    return current;
  }
};
