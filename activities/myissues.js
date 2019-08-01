const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    const pagination = $.pagination(activity);
    let pageSize = parseInt(pagination.pageSize);
    let offset = (parseInt(pagination.page) - 1) * pageSize;

    // if its first page try get 100 items to get value for status
    const page = parseInt(pagination.page);

    const response = await api(`/incident?sysparm_limit=${page === 1 ? 100 : pageSize}&sysparm_offset=${offset}&sysparm_query=caller_id=javascript:gs.getUserID()^active=true`);
    if ($.isErrorResponse(activity, response)) return;

    let items = response.body.result.map(item => convert_item(item));
    let value = items.length;

    items.sort((a, b) => {
      a = new Date(a.date);
      b = new Date(b.date);

      return a > b ? -1 : (a < b ? 1 : 0);
    });

    // if its first page we return items requested in pagination.pageSize
    if (page == 1) {

      // if if pageSize is less than items.length we return items requested in pagination.pageSize
      if(pageSize<items.length){
        let filteredItems = [];

        for(let i=0; i<pageSize; i++){
          filteredItems.push(items[i]);
        }
        items = filteredItems;
      }
    }

    activity.Response.Data.items = items;
    if (parseInt(pagination.page) == 1) {

      // if pagesize is 99 return number of items else if page size is greater than number of items 
      // return number of items, else return pagesize
      activity.Response.Data.title = T(activity, 'Open Issues you\'ve created');
      activity.Response.Data.link = `https://zensardemo2.service-now.com/incident_list.do?sysparm_query=active=true^EQ&active=true&sysparm_clear_stack=true`;
      activity.Response.Data.linkLabel = T(activity, 'All Issues');
      activity.Response.Data.actionable = value > 0;

      if (value > 0) {
        activity.Response.Data.value = value;
        activity.Response.Data.date = activity.Response.Data.items[0].date;
        activity.Response.Data.color = 'blue';
        activity.Response.Data.description = value > 1 ? T(activity, "You have {0} open issues.", value)
          : T(activity, "You have 1 open issue.");
      } else {
        activity.Response.Data.description = T(activity, `You have no open issues.`);
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }

  function convert_item(_item) {
    return {
      id: _item.number,
      title: _item.short_description,
      description: _item.description,
      date: convert_date(_item.opened_at),
      link: `https://zensardemo2.service-now.com/nav_to.do?uri=incident.do?sys_id=${_item.sys_id}%26sysparm_view=sp`
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
};
