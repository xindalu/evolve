/*
 * This calendar application was forked from Ext Calendar Pro
 * and contributed to Ext JS as an advanced example of what can 
 * be built using and customizing Ext components and templates.
 * 
 * If you find this example to be useful you should take a look at
 * the original project, which has more features, more examples and
 * is maintained on a regular basis:
 * 
 *  http://ext.ensible.com/products/calendar
 */
Ext.define('Ext.calendar.App', {
    
    requires: [
        'Ext.Viewport',
        'Ext.layout.container.Border',
        'Ext.picker.Date',
        'Ext.calendar.util.Date',
        'Ext.calendar.CalendarPanel',
        'Ext.calendar.data.MemoryCalendarStore',
        'Ext.calendar.data.MemoryEventStore',
        'Ext.calendar.data.Events',
        'Ext.calendar.data.Calendars',
        'Ext.calendar.form.EventWindow'
    ],
    
    constructor : function() {
        var me;
        // Minor workaround for OSX Lion scrollbars
        this.checkScrollOffset();
        
        // This is an example calendar store that enables event color-coding
        this.calendarStore = Ext.create('Ext.calendar.data.MemoryCalendarStore', {
            data: Ext.calendar.data.Calendars.getData()
        });

        // A sample event store that loads static JSON from a local file. Obviously a real
        // implementation would likely be loading remote data via an HttpProxy, but the
        // underlying store functionality is the same.
        this.eventStore = Ext.create('Ext.calendar.data.MemoryEventStore', {});
        this.responsible = Ext.create('Ext.data.Store', {
            model: Ext.define('employee', {
                extend: 'Ext.data.Model',
                idProperty: 'id',
                fields: [{name: "id"},
                    {name: "number"},
                    {name: "cname"},
                    {name: "email"}
                ]
            }),
            proxy: {
                type: 'ajax',
                reader: {
                    root: 'rows',
                    totalProperty: 'total'
                },
                url: getRootPath() + '/public/user/task/getsubusers'
            },
            autoLoad: true
        });
        this.processStore = Ext.create('Ext.data.Store', {
            model: 'process',
            proxy: {
                type: 'ajax',
                reader: 'json',
                url: getRootPath() + '/public/user/task/process'
            },
            autoLoad: false
        });
        this.employeeStore = Ext.create('Ext.data.Store', {
            model: Ext.define('employee', {
                extend: 'Ext.data.Model',
                idProperty: 'id',
                fields: [{name: "id"},
                    {name: "number"},
                    {name: "cname"},
                    {name: "email"}
                ]
            }),
            proxy: {
                type: 'ajax',
                reader: {
                    root: 'rows',
                    totalProperty: 'total'
                },
                url: getRootPath() + '/public/hra/employee/getEmployeeforsel'
            },
            autoLoad: true
        });

        me = this;
        
        // This is the app UI layout code.  All of the calendar views are subcomponents of
        // CalendarPanel, but the app title bar and sidebar/navigation calendar are separate
        // pieces that are composed in app-specific layout code since they could be omitted
        // or placed elsewhere within the application.
        Ext.create('Ext.Viewport', {
            layout: 'border',
            renderTo: 'calendar-ct',
            items: [{
                xtype: 'component',
                id: 'app-header',
                region: 'north',
                height: 15,
                contentEl: 'app-header-content'
            },{
                id: 'app-center',
                title: '...', // will be updated to the current view's date range
                region: 'center',
                layout: 'border',
                listeners: {
                    'afterrender': function(){
                        Ext.getCmp('app-center').header.addCls('app-center-header');
                    }
                },
                items: [{
                    xtype: 'container',
                    id:'app-west',
                    region: 'west',
                    width: Ext.themeName === 'neptune' ? 214 : 179,
                    items: [{
                        xtype: 'datepicker',
                        id: 'app-nav-picker',
                        cls: 'ext-cal-nav-picker',
                        listeners: {
                            'select': {
                                fn: function(dp, dt){
                                    Ext.getCmp('app-calendar').setStartDate(dt);
                                },
                                scope: this
                            }
                        }
                    },Ext.create('Ext.tree.Panel', {
                        store: Ext.create('Ext.data.TreeStore', {
                            root: {
                                id       : user,
                                expanded : false,
                                cname     : userName,
                                root     : true
                            },
                            model: Ext.define('employee', {
                                extend: 'Ext.data.Model',
                                idProperty: 'id',
                                fields: [{ name: "id" },
                                    { name: "expanded" },
                                    { name: "cname" },
                                    { name: "number" }
                                ]
                            }),
                            proxy: {
                                type: 'ajax',
                                reader: 'json',
                                url: getRootPath() + '/public/user/task/getuser'
                            },
                            autoLoad: true
                        }),
                        useArrows: true,
                        rootVisible: true,
                        border: true,
                        hideHeaders: true,
                        bodyPadding: 2,
                        title: '任务监控列表',
                        id: 'westList',
                        region: 'west',
                        border:0,
                        height: 380,
                        width: Ext.themeName === 'neptune' ? 214 : 179,
                        closeAction: 'hide',
                        layout: 'fit',
                        viewConfig: {
                            stripeRows: false
                        },
                        columns: [{
                            xtype:'treecolumn',
                            width: Ext.themeName === 'neptune' ? 192 : 157,
                            dataIndex: 'cname'
                        }
                        ],
                        listeners: {
                            selectionchange: function(model, records) {
                                if (records[0]) {
                                    var record= records[0];
                                    this.eventStore.removeAll();
                                    //this.eventStore.sync();
                                    var employeeId = record.data.id;
                                    if(record.data.id == '/') {
                                        if(records.length > 1) {
                                            employeeId = record[1].data.id;
                                        } else {
                                            employeeId = '';
                                        }
                                    }
                                    this.eventStore.load({
                                        params:{
                                            employeeId: employeeId
                                        }
                                    });

                                }
                            },
                            scope: this
                        }
                    })]
                },{
                    xtype: 'calendarpanel',
                    eventStore: this.eventStore,
                    calendarStore: this.calendarStore,
                    border: false,
                    id:'app-calendar',
                    region: 'center',
                    activeItem: 3, // month view
                    
                    monthViewCfg: {
                        showHeader: true,
                        showWeekLinks: true,
                        showWeekNumbers: true
                    },
                    
                    listeners: {
                        'eventclick': {
                            fn: function(vw, rec, el){
                                this.showEditWindow(rec, el);
                                this.clearMsg();
                            },
                            scope: this
                        },
                        'eventover': function(vw, rec, el){
                            //console.log('Entered evt rec='+rec.data.Title+', view='+ vw.id +', el='+el.id);
                        },
                        'eventout': function(vw, rec, el){
                            //console.log('Leaving evt rec='+rec.data.Title+', view='+ vw.id +', el='+el.id);
                        },
                        'eventadd': {
                            fn: function(cp, rec){
                                this.showMsg('Event '+ rec.data.Title +' was added');
                            },
                            scope: this
                        },
                        'eventupdate': {
                            fn: function(cp, rec){
                                this.showMsg('Event '+ rec.data.Title +' was updated');
                            },
                            scope: this
                        },
                        'eventcancel': {
                            fn: function(cp, rec){
                                // edit canceled
                            },
                            scope: this
                        },
                        'viewchange': {
                            fn: function(p, vw, dateInfo){
                                if(this.editWin){
                                    this.editWin.hide();
                                }
                                if(dateInfo){
                                    // will be null when switching to the event edit form so ignore
                                    Ext.getCmp('app-nav-picker').setValue(dateInfo.activeDate);
                                    this.updateTitle(dateInfo.viewStart, dateInfo.viewEnd);
                                }
                            },
                            scope: this
                        },
                        'dayclick': {
                            fn: function(vw, dt, ad, el){
                                if(vw.title == 'Month') {
                                    dt = Ext.calendar.util.Date.add(dt, {hours: 9});
                                }
                                this.showEditWindow({
                                    StartDate: dt,
                                    IsAllDay: ad
                                }, el);
                                this.clearMsg();
                            },
                            scope: this
                        },
                        'rangeselect': {
                            fn: function(win, dates, onComplete){
                                this.showEditWindow(dates);
                                this.editWin.on('hide', onComplete, this, {single:true});
                                this.clearMsg();
                            },
                            scope: this
                        },
                        'eventmove': {
                            fn: function(vw, rec){
                                var mappings = Ext.calendar.data.EventMappings,
                                    time = rec.data[mappings.IsAllDay.name] ? '' : ' \\a\\t g:i a';
                                
                                rec.commit();
                                
                                this.showMsg('Event '+ rec.data[mappings.Title.name] +' was moved to '+
                                    Ext.Date.format(rec.data[mappings.StartDate.name], ('F jS'+time)));
                            },
                            scope: this
                        },
                        'eventresize': {
                            fn: function(vw, rec){
                                rec.commit();
                                this.showMsg('Event '+ rec.data.Title +' was updated');
                            },
                            scope: this
                        },
                        'eventdelete': {
                            fn: function(win, rec){
                                this.eventStore.remove(rec);
                                this.showMsg('Event '+ rec.data.Title +' was deleted');
                            },
                            scope: this
                        },
                        'initdrag': {
                            fn: function(vw){
                                if(this.editWin && this.editWin.isVisible()){
                                    this.editWin.hide();
                                }
                            },
                            scope: this
                        }
                    }
                }]
            }]
        });
    },
        
    // The edit popup window is not part of the CalendarPanel itself -- it is a separate component.
    // This makes it very easy to swap it out with a different type of window or custom view, or omit
    // it altogether. Because of this, it's up to the application code to tie the pieces together.
    // Note that this function is called from various event handlers in the CalendarPanel above.
    showEditWindow : function(rec, animateTarget){
        // 读取当前人信息
        var editable = true;
        var responsible = String(user);
        if(!rec.data) {
            var view = Ext.getCmp('westList').getView();
            var model = view.getSelectionModel();
            if (model) {
                var record = model.getLastSelected();
                if(record) {
                    responsible = record.data.id;
                }
            }
            rec.initData = {};
            rec.initData.Responsible_id = responsible;
            rec.initData.Responsible = responsible;

            this.processStore.removeAll();
        } else {
            // 编辑
            var id = rec.data.id;
            this.processStore.load({
                params: {
                    'task_id' : id,
                    'employee_id' : user
                }
            });
            if(rec.data.owner == '0') {
                editable = false;
            }
        }
        rec.readOnly = !editable;
        if(!this.editWin){
            this.editWin = Ext.create('Ext.calendar.form.EventWindow', {
                calendarStore: this.calendarStore,
                responsible: this.responsible,
                processStore: this.processStore,
                employeeStore: this.employeeStore,
                readOnly: !editable,
                listeners: {
                    'eventadd': {
                        fn: function(win, rec){
                            Ext.Msg.wait('提交中，请稍后...', '提示');
                            rec.data.CalendarId = 1;

                            rec.data.IsNew = false;
                            if(rec.data.id) {
                                rec.setDirty();
                                this.eventStore.add(rec);
                            } else {
                                rec.data.Relation = 1; // TODO
                                this.eventStore.add(rec);
                            }
                            var me = this;
                            this.eventStore.sync({
                                rollback:function() {
                                    Ext.MessageBox.hide();
                                },
                                success:function(a){
                                    Ext.Msg.hide();
                                    var json = Ext.JSON.decode(a.operations[0].response.responseText);
                                    if(json.success) {
                                        rec.data.id = json.id;
                                        me.eventStore.removeAll();
                                        me.eventStore.reload();
                                        win.hide();
                                    }
                                }
                            });
                            this.showMsg('任务 '+ rec.data.Title +' 已添加');
                        },
                        scope: this
                    },
                    'eventupdate': {
                        fn: function(win, rec){
                            win.hide();
                            rec.commit();
                            this.eventStore.sync();
                            this.showMsg('任务 '+ rec.data.Title +' 已更新');
                        },
                        scope: this
                    },
                    'eventdelete': {
                        fn: function(win, rec){
                            this.eventStore.remove(rec);
                            this.eventStore.sync();
                            win.hide();
                            this.showMsg('任务 '+ rec.data.Title +' 已删除');
                        },
                        scope: this
                    },
                    'editdetails': {
                        fn: function(win, rec){
                            win.hide();
                            Ext.getCmp('app-calendar').showEditForm(rec);
                        }
                    }
                }
            });
        }
        this.editWin.show(rec, animateTarget);
    },
        
    // The CalendarPanel itself supports the standard Panel title config, but that title
    // only spans the calendar views.  For a title that spans the entire width of the app
    // we added a title to the layout's outer center region that is app-specific. This code
    // updates that outer title based on the currently-selected view range anytime the view changes.
    updateTitle: function(startDt, endDt){
        var p = Ext.getCmp('app-center'),
            fmt = Ext.Date.format;
        
        if(Ext.Date.clearTime(startDt).getTime() == Ext.Date.clearTime(endDt).getTime()){
            p.setTitle(fmt(startDt, 'Y-m-d'));
        }
        else if(startDt.getFullYear() == endDt.getFullYear()){
            if(startDt.getMonth() == endDt.getMonth()){
                p.setTitle(fmt(startDt, 'Y-m-d') + ' - ' + fmt(endDt, 'Y-m-d'));
            }
            else{
                p.setTitle(fmt(startDt, 'Y-m-d') + ' - ' + fmt(endDt, 'Y-m-d'));
            }
        }
        else{
            p.setTitle(fmt(startDt, 'Y-m-d') + ' - ' + fmt(endDt, 'Y-m-d'));
        }
    },
    
    // This is an application-specific way to communicate CalendarPanel event messages back to the user.
    // This could be replaced with a function to do "toast" style messages, growl messages, etc. This will
    // vary based on application requirements, which is why it's not baked into the CalendarPanel.
    showMsg: function(msg){
        Ext.fly('app-msg').update(msg).removeCls('x-hidden');
    },
    clearMsg: function(){
        Ext.fly('app-msg').update('').addCls('x-hidden');
    },
    
    // OSX Lion introduced dynamic scrollbars that do not take up space in the
    // body. Since certain aspects of the layout are calculated and rely on
    // scrollbar width, we add a special class if needed so that we can apply
    // static style rules rather than recalculate sizes on each resize.
    checkScrollOffset: function() {
        var scrollbarWidth = Ext.getScrollbarSize ? Ext.getScrollbarSize().width : Ext.getScrollBarWidth();
        
        // We check for less than 3 because the Ext scrollbar measurement gets
        // slightly padded (not sure the reason), so it's never returned as 0.
        if (scrollbarWidth < 3) {
            Ext.getBody().addCls('x-no-scrollbar');
        }
        if (Ext.isWindows) {
            Ext.getBody().addCls('x-win');
        }
    }
},
function() {
    /*
     * A few Ext overrides needed to work around issues in the calendar
     */
    
    Ext.form.Basic.override({
        reset: function() {
            var me = this;
            // This causes field events to be ignored. This is a problem for the
            // DateTimeField since it relies on handling the all-day checkbox state
            // changes to refresh its layout. In general, this batching is really not
            // needed -- it was an artifact of pre-4.0 performance issues and can be removed.
            //me.batchLayouts(function() {
                me.getFields().each(function(f) {
                    f.reset();
                });
            //});
            return me;
        }
    });
    
    // Currently MemoryProxy really only functions for read-only data. Since we want
    // to simulate CRUD transactions we have to at the very least allow them to be
    // marked as completed and successful, otherwise they will never filter back to the
    // UI components correctly.
    Ext.data.MemoryProxy.override({
        updateOperation: function(operation, callback, scope) {
            operation.setCompleted();
            operation.setSuccessful();
            Ext.callback(callback, scope || this, [operation]);
        },
        create: function() {
            this.updateOperation.apply(this, arguments);
        },
        update: function() {
            this.updateOperation.apply(this, arguments);
        },
        destroy: function() {
            this.updateOperation.apply(this, arguments);
        }
    });
});