/**
 * Copyright (c) 2015-2018, FineX, All Rights Reserved.
 *
 */

'use strict';
const _ = require('lodash');
const request = require('request');
const async = require('async');

const WebSite = 'https://www.jiandaoyun.com';
const retryIfLimited = true;

class APIUtils {

    /**
     * 构造方法
     * @param { Object } options
     * @param { String } options.appId - 应用id
     * @param { String } options.entryId - 表单id
     * @param { String } options.api_key - api_key
     */
    constructor(options) {
        this.options = _.defaults(options, {
            api_key: ''
        });
        const appId = options.appId;
        const entryId = options.entryId;
        this.urlGetWidgets = `${WebSite}/api/v1/app/${ appId }/entry/${ entryId }/widgets`;
        this.urlGetData = `${WebSite}/api/v1/app/${ appId }/entry/${ entryId }/data`;
        this.urlRetrieveData = `${WebSite}/api/v1/app/${ appId }/entry/${ entryId }/data_retrieve`;
        this.urlCreateData = `${WebSite}/api/v1/app/${ appId }/entry/${ entryId }/data_create`;
        this.urlUpdateData = `${WebSite}/api/v1/app/${ appId }/entry/${ entryId }/data_update`;
        this.urlDeleteData = `${WebSite}/api/v1/app/${ appId }/entry/${ entryId }/data_delete`;
    }

    /**
     * 发送http请求
     * @param { String } method - HTTP动词 (GET|POST)
     * @param { String } url - 请求path
     * @param { Object } data - 请求参数|数据
     * @param { Function } callback - 回调方法
     */
     sendRequest (method, url, data, callback) {
        const httpMethod = _.toUpper(method);
        const options = {
            method: httpMethod,
            url: url,
            headers: this.getReqHeaders(),
            // 超时时间
            timeout: 5000
        };
        if (httpMethod === 'GET') {
            // query string
            options.qs = data;
        } else {
            // body
            options.body = JSON.stringify(data);
        }
        request(options, (err, res) => {
            if (err) {
                return callback(err);
            }
            const result = JSON.parse(res.body);
            if (res.statusCode >= 400) {
                if (result.code === 8303 && retryIfLimited) {
                    // 超出频率限制, 5s后重试
                    return setTimeout(() => this.sendRequest(method, url, data, callback), 5000);
                } else {
                    return callback(new Error(`请求错误！Error Code: ${ result.code }, Error Msg: ${ result.msg }`));
                }
            }
            return callback(err, result);
    });
    }

    /**
     * 获取HTTP请求头信息
     * @return { Object }
     */
    getReqHeaders () {
        const o = this.options;
        return {
            'Authorization': `Bearer ${ o.api_key }`,
            'Content-type': 'application/json;charset=utf-8'
        }
    }

    /**
     * 获取表单字段
     * @param { Function } callback
     */
    getFormWidgets (callback) {
        this.sendRequest('POST', this.urlGetWidgets, {}, (err, result) => {
            if (err) {
                return callback(err);
            }
            return callback(null, _.get(result, 'widgets', []));
        });
    }

    /**
     * 获取表单数据
     * @param { int } limit - 查询的数据条数
     * @param { [String] } fields - 显示的字段列表
     * @param { Object } filter - 过滤配置
     * @param { String } dataId - 上一次查询数据结果的最后一条数据的id
     * @param { Function } callback
     */
    getFormData (limit, fields, filter, dataId, callback) {
        const data = {
            limit: limit,
            fields: fields,
            filter: filter,
            data_id: dataId
        };
        this.sendRequest('POST', this.urlGetData, data, (err, result) => {
            if (err) {
                return callback(err);
            }
            return callback(null, _.get(result, 'data', []));
        });
    }

    /**
     * 获取表单中的所有数据
     * @param { [String] } fields - 要显示的字段
     * @param { Object } filter - 过滤条件
     * @param { Function } callback - 回调函数
     */
    getAllFormData (fields, filter, callback) {
        // 表单数据
        const formData = [];
        // 获取单页数据
        const getNextPageData = (offset) => {
            this.getFormData(100, fields, filter, offset, (err ,data) => {
                if (err) {
                    // 错误处理
                    return callback(err);
                }
                if (_.isEmpty(data)) {
                    // 没有更多的数据
                    return callback(null, formData);
                } else {
                    const offset = _.get(_.last(data), '_id');
                    formData.push(...data);
                    getNextPageData(offset);
                }
            });
        };
        // 开始取数据
        getNextPageData('');
    }

    /**
     * 查询单条数据
     * @param { String } dataId - 数据id
     * @param { Function } callback
     */
    retrieveData (dataId, callback) {
        this.sendRequest('POST', this.urlRetrieveData, {
            data_id: dataId
        }, (err, result) => {
            if (err) {
                return callback(err);
            }
            return callback(null, _.get(result, 'data', {}));
        });
    }

    /**
     * 更新单条数据
     * @param { String } dataId - 数据id
     * @param { Object } update - 更新的内容
     * @param { Function } callback
     */
    updateData (dataId, update, callback) {
        this.sendRequest('POST', this.urlUpdateData, {
            data_id: dataId,
            data: update
        }, (err, result) => {
            if (err) {
                return callback(err);
            }
            return callback(null, _.get(result, 'data', {}));
        });
    }

    /**
     * 创建单条数据
     * @param { Object } data - 数据内容
     * @param { Function } callback
     */
    createData (data, callback) {
        this.sendRequest('POST', this.urlCreateData, {
            data: data
        }, (err, result) => {
            if (err) {
                return callback(err);
            }
            return callback(null, _.get(result, 'data', {}));
        });
    }

    /**
     * 删除数据
     * @param { String } dataId
     * @param { Function } callback
     */
    deleteData (dataId, callback) {
        this.sendRequest('POST', this.urlDeleteData, {
            data_id: dataId
        }, callback);
    }
}

/**
 * 测试代码
 */
function test() {
    const appId = '5b1747e93b708d0a80667400';
    const entryId = '5b1749ae3b708d0a80667408';
    const api_key = 'CTRP5jibfk7qnnsGLCCcmgnBG6axdHiX';
    const api = new APIUtils({
        appId: appId,
        entryId: entryId,
        api_key: api_key
    });

    // 获取表单字段
    api.getFormWidgets((err, widgets) => {
        if (err) {
            console.log(err);
        } else {
            console.log('表单字段：');
            console.log(JSON.stringify(widgets, null, 2));
        }
    });

    // 按条件获取表单数据
    api.getFormData(100, ['_widget_1528252846720', '_widget_1528252846801'], {
        rel: 'and',
        cond: [{
            field: '_widget_1528252846720',
            type: 'text',
            method: 'empty'
        }]
    }, null, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            console.log('条件查询表单数据：');
            _.forEach(data, (data) => console.log(JSON.stringify(data)));
        }
    });

    // 获取表单所有字段
    api.getAllFormData([], {}, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            console.log('表单全部数据：');
            _.forEach(data, (data) => console.log(JSON.stringify(data)));
        }
    });

    const data = {
        // 单行文本
        _widget_1528252846720: {
            value: '123'
        },
        // 子表单
        _widget_1528252846801: {
            value: [{
                _widget_1528252846952: {
                    value: '123'
                }
            }]
        },
        // 数字
        _widget_1528252847027: {
            value: 123
        },
        // 地址
        _widget_1528252846785: {
            value: {
                province: '江苏省',
                city: '无锡市',
                district: '南长区',
                detail: '清名桥街道'
            }
        },
        // 多行文本
        _widget_1528252846748: {
            value: '123123'
        }
    };

    const updateData = {
        // 单行文本
        _widget_1528252846720: {
            value: '12345'
        },
        // 子表单
        _widget_1528252846801: {
            value: [{
                _widget_1528252846952: {
                    value: '12345'
                }
            }]
        },
        // 数字
        _widget_1528252847027: {
            value: 12345
        }
    };

    async.auto({
        // 创建单条数据
        create: (callback) => {
            api.createData(data, (err, newData) => {
                if (err) {
                    return callback(err);
                }
                console.log('创建单条数据：');
                console.log(JSON.stringify(newData));
                return callback(null, newData);
            });
        },
        // 更新单条数据
        update: ['create', (result, callback) => {
            const createData = result.create;
            api.updateData(createData['_id'], updateData, (err, data) => {
                if (err) {
                    return callback(err);
                }
                console.log('更新单条数据：');
                console.log(data);
                return callback();
            });
        }],
        // 查询单条数据
        query: ['update', (result, callback) => {
            const createData = result.create;
            api.retrieveData(createData['_id'], (err, data) => {
                if (err) {
                    return callback(err);
                } else {
                    console.log('查询单条数据：');
                    console.log(JSON.stringify(data));
                    return callback();
                }
            });
        }],
        // 删除单条数据
        delData: ['query', (result, callback) => {
            const createData = result.create;
            api.deleteData(createData['_id'], (err, res) => {
                if (err) {
                    return callback(err);
                }
                console.log('删除单条数据：');
                console.log(res);
                return callback();
            });
        }]
    }, (err) => console.log(err))
}

test();