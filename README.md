简道云 API接口调用演示
=====

此项目为nodejs开发环境下，调用简道云API接口进行表单字段查询和数据增删改查的示例。

具体API接口参数请参考帮助文档： https://hc.jiandaoyun.com/doc/10993

## 演示代码

演示工程经过 node 8.x 环境测试。

使用前首先安装相关依赖:

```bash
npm install
```

修改代码中的appId、entryId和APIKey

```javascript
    const appId = '5b1747e93b708d0a80667400';
    const entryId = '5b1749ae3b708d0a80667408';
    const api_key = 'CTRP5jibfk7qnnsGLCCcmgnBG6axdHiX';
```

根据表单配置修改各个请求方法的请求参数

启动测试

```bash
node ./demo.js
```



## 示例方法说明

```
获取表单字段
getFormWidgets(callback)

按条件获取表单数据
// limit - 取出的数据条数
// fields - 显示的字段 (为空显示全部字段)
// filter - 过滤条件
// dataId - 取数的起始位置（不包含dataId所在的数据）
getFormData(limit, fields, filter, dataId, callback)

递归获取所有数据
// fields - 显示的字段 (为空显示全部字段)
// filter - 过滤条件
getAllFormData(fields, filter, callback)

创建单条数据
// data - 数据内容
createData(data, callback)

更新单条数据
// dataId - 数据id
// data - 更新的内容
updateData(dataId, data, callback)

查询单条数据
// dataId - 数据id
retrieveData(dataId, callback)

删除单条数据
// dataId - 数据id
deleteData(dataId, callback)
```