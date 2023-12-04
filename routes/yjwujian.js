const Router = require("koa-router");
const yjwujianRouter = new Router();
const axios = require("axios");
const cheerio = require("cheerio");
const { get, set, del } = require("../utils/cacheData");

// 缓存键名
const cacheKey = "yjwujianData";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://www.yjwujian.cn/news/";

// 数据处理
const getData = (data) => {
  if (!data) return [];
  const dataList = [];
  try {
    const $ = cheerio.load(data);
    $(".news-itme").map((idx, item) => {
      const dateId = $(item).attr("href").split("/").at(-2) ?? "";
      const id =  '/' + $(item).attr("href").split("/").at(-1) ?? "";
      console.log($(".title")[idx].children[0].data);
      dataList.push({
        title: $(".title")[idx].children[0].data,
        // desc: $(".title")[idx].children[0].data,
        url: `https://www.yjwujian.cn/news/official/${id}${dateId}`,
        mobileUrl: `https://www.yjwujian.cn/news/official/${id}${dateId}`,
      })
    })
    // return $(".news-itme .title")
    return dataList;
  } catch (error) {
    console.error("数据处理出错" + error);
    return false;
  }
};

// 永杰无间更新公告
yjwujianRouter.get("/yjwujian", async (ctx) => {
  console.log("获取永杰无间更新公告");
  try {
    // 从缓存中获取数据
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      // 如果缓存中不存在数据
      console.log("从服务端重新获取永杰无间更新公告");
      // 从服务器拉取数据
      const response = await axios.get(url);
      data = getData(response.data);
      updateTime = new Date().toISOString();
      if (!data) {
        ctx.body = {
          code: 500,
          title: "永杰无间",
          subtitle: "更新公告",
          message: "获取失败",
        };
        return false;
      }
      // 将数据写入缓存
      await set(cacheKey, data);
    }
    ctx.body = {
      code: 200,
      message: "获取成功",
      title: "永杰无间",
      subtitle: "更新公告",
      from,
      total: data.length,
      updateTime,
      data,
    };
  } catch (error) {
    console.error(error);
    ctx.body = {
      code: 500,
      message: "获取失败",
    };
  }
});

// 永杰无间更新公告 - 获取最新数据
yjwujianRouter.get("/yjwujian/new", async (ctx) => {
  console.log("获取永杰无间更新公告 - 最新数据");
  try {
    // 从服务器拉取最新数据
    const response = await axios.get(url);
    const newData = getData(response.data);
    updateTime = new Date().toISOString();
    console.log("从服务端重新获取");

    // 返回最新数据
    ctx.body = {
      code: 200,
      message: "获取成功",
      title: "永杰无间",
      subtitle: "更新公告",
      total: newData.length,
      updateTime,
      data: newData,
    };

    // 删除旧数据
    await del(cacheKey);
    // 将最新数据写入缓存
    await set(cacheKey, newData);
  } catch (error) {
    // 如果拉取最新数据失败，尝试从缓存中获取数据
    console.error(error);
    const cachedData = await get(cacheKey);
    if (cachedData) {
      ctx.body = {
        code: 200,
        message: "获取成功",
        title: "永杰无间",
        subtitle: "更新公告",
        total: cachedData.length,
        updateTime,
        data: cachedData,
      };
    } else {
      // 如果缓存中也没有数据，则返回错误信息
      ctx.body = {
        code: 500,
        title: "永杰无间",
        subtitle: "更新公告",
        message: "获取失败",
      };
    }
  }
});

module.exports = yjwujianRouter;
