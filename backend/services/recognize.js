// =========================================================
// 食物识别服务 — 接入百度智能云「菜品识别」API
// 文档:https://cloud.baidu.com/doc/IMAGERECOGNITION/s/tk3bcxbb0
// 免费额度:500 次/天
// =========================================================

import { NUTRITION_DB, getFoodById } from '../data/nutrition.js';

const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;
const HAS_KEY = !!(BAIDU_API_KEY && BAIDU_SECRET_KEY);

// 缓存的 access_token(百度 token 有效期 30 天,缓存复用)
let _cachedToken = null;
let _tokenExpireAt = 0;

/**
 * 获取百度 access_token(自动缓存)
 */
async function getBaiduToken() {
  // 如果 token 还有 1 小时以上有效期,继续用
  if (_cachedToken && Date.now() < _tokenExpireAt - 3600 * 1000) {
    return _cachedToken;
  }
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (data.error) {
    throw new Error('百度 API 鉴权失败:' + (data.error_description || data.error));
  }
  _cachedToken = data.access_token;
  // expires_in 单位是秒,转成毫秒
  _tokenExpireAt = Date.now() + (data.expires_in || 2592000) * 1000;
  console.log('[recognize] 百度 access_token 已获取,有效期', Math.floor(data.expires_in / 86400), '天');
  return _cachedToken;
}

// 百度菜名 → 我们数据库 id 的映射表
// =========================================================
// ⚠️ 重要:此表按顺序匹配,先具体后通用!
// 比如"黄焖鸡米饭"必须在"鸡"和"米饭"之前,否则会被错误匹配。
// 凡是命中关键词的都映射,没命中的就丢弃(不伪造)。
// =========================================================
const DISH_KEYWORD_MAP = [
  // ===== 复合菜名(必须最先匹配,避免被通用词截走) =====
  // ⚠️ 含"鸡腿/鸡翅/芝士/牛肉/猪肉"等通用词的复合菜名必须优先匹配
  { keywords: ['麦辣鸡腿堡', '香辣鸡腿堡', '鸡腿堡', '老北京鸡肉卷'], id: 'chicken_burger' },
  { keywords: ['芝士奶盖茶', '奶盖茶', '芝士茶', '海盐芝士'], id: 'cheese_tea' },
  { keywords: ['奥尔良鸡翅', '炸鸡翅'], id: 'fried_chicken_wing' },
  { keywords: ['麦乐鸡', '麦乐鸡块', '鸡块', '鸡米花'], id: 'chicken_nugget' },

  // 外卖热门组合菜
  { keywords: ['黄焖鸡米饭', '黄焖鸡'], id: 'huangmenji' },
  { keywords: ['酸菜鱼'], id: 'pickled_fish' },
  { keywords: ['水煮鱼'], id: 'boiled_fish' },
  { keywords: ['水煮牛肉'], id: 'boiled_beef' },
  { keywords: ['麻辣香锅', '香锅'], id: 'mala_xiangguo' },
  { keywords: ['麻辣烫'], id: 'malatang' },
  { keywords: ['螺蛳粉', '螺狮粉'], id: 'luosifen' },
  { keywords: ['兰州拉面', '兰州牛肉面'], id: 'lanzhou_noodle' },
  { keywords: ['炸酱面'], id: 'zhajiang_noodle' },
  { keywords: ['担担面'], id: 'dandan_noodle' },
  { keywords: ['热干面'], id: 'hot_dry_noodle' },
  { keywords: ['凉皮', '凉面', '陕西凉皮'], id: 'cold_noodle' },
  { keywords: ['牛肉面', '红烧牛肉面'], id: 'beef_noodle' },
  { keywords: ['咖喱饭'], id: 'curry_rice' },
  { keywords: ['咖喱鸡'], id: 'curry_chicken' },
  { keywords: ['亲子盖饭', '亲子丼'], id: 'oyakodon' },
  { keywords: ['猪排盖饭', '猪排丼', '炸猪排饭'], id: 'katsudon' },
  { keywords: ['炸猪排', '日式炸猪排', '吉列猪排'], id: 'fried_pork_chop' },
  { keywords: ['石锅拌饭', '韩式拌饭', '拌饭'], id: 'bibimbap' },
  { keywords: ['泡菜汤', '泡菜锅', '部队锅'], id: 'kimchi_stew' },
  { keywords: ['泰式打抛鸡', '打抛猪', '打抛肉', '打抛'], id: 'thai_basil_chicken' },

  // ===== 🍝 西式正餐(复合菜名,优先匹配)=====
  { keywords: ['惠灵顿牛排', '惠灵顿'], id: 'beef_wellington' },
  { keywords: ['肋眼牛排', '肉眼牛排', '眼肉牛排'], id: 'ribeye_steak' },
  { keywords: ['西冷牛排', '沙朗牛排'], id: 'sirloin_steak' },
  { keywords: ['菲力牛排', '菲力'], id: 'filet_mignon' },
  { keywords: ['烤牛肉', '英式烤牛肉', 'roast beef'], id: 'roast_beef' },
  { keywords: ['勃艮第红酒炖牛肉', '红酒炖牛肉', '勃艮第'], id: 'beef_bourguignon' },
  { keywords: ['炖牛肉', '土豆炖牛肉块', '匈牙利牛肉汤'], id: 'beef_stew' },
  { keywords: ['羊排', '法式羊排', '香煎羊排'], id: 'lamb_chop' },
  { keywords: ['烤羊腿', '羊腿'], id: 'roast_lamb_leg' },
  { keywords: ['烤火鸡', '火鸡'], id: 'roast_turkey' },
  { keywords: ['香煎鸭胸', '鸭胸'], id: 'roast_duck_breast' },
  { keywords: ['蓝带鸡排', '蓝带鸡'], id: 'chicken_cordon_bleu' },
  { keywords: ['香煎鸡排', '烤鸡排', '烤鸡胸', '香煎鸡胸'], id: 'grilled_chicken' },
  { keywords: ['德式烤猪肘', '烤猪肘', '猪肘', '咸猪手'], id: 'roast_pork_knuckle' },
  { keywords: ['香煎猪排', '烤猪排', '西式猪排'], id: 'pork_chop' },
  { keywords: ['炸鱼薯条', '炸鱼柳'], id: 'fish_and_chips' },
  { keywords: ['香煎三文鱼', '烤三文鱼', '三文鱼排'], id: 'grilled_salmon' },
  { keywords: ['西班牙海鲜饭', '海鲜饭', 'paella'], id: 'seafood_paella' },
  { keywords: ['意式烩饭', '烩饭', 'risotto', '芝士烩饭'], id: 'risotto' },
  { keywords: ['千层面', '千层意面', 'lasagna', 'lasagne'], id: 'lasagna' },
  { keywords: ['玛格丽特披萨', '玛格丽特'], id: 'margherita_pizza' },
  { keywords: ['青酱意面', '罗勒青酱', 'pesto'], id: 'pesto_pasta' },
  { keywords: ['奶油白酱意面', '白酱意面', '阿尔弗雷多', 'alfredo'], id: 'alfredo_pasta' },
  { keywords: ['芝士通心粉', '芝士意面', 'mac and cheese', '芝士焗通心粉'], id: 'mac_and_cheese' },
  { keywords: ['马铃薯团子', '土豆团子', 'gnocchi'], id: 'gnocchi' },
  { keywords: ['普罗旺斯杂烩', '杂菜煲', 'ratatouille'], id: 'ratatouille' },
  { keywords: ['土豆泥', '薯泥', 'mashed potato'], id: 'mashed_potato' },
  { keywords: ['法式洋葱汤', '洋葱汤', 'french onion'], id: 'french_onion_soup' },
  { keywords: ['奶油蘑菇汤', '蘑菇浓汤', '蘑菇汤'], id: 'mushroom_soup' },
  { keywords: ['南瓜浓汤', '南瓜汤'], id: 'pumpkin_soup' },
  { keywords: ['蛤蜊巧达浓汤', '巧达汤', '蛤蜊浓汤', 'clam chowder'], id: 'clam_chowder' },
  { keywords: ['希腊沙拉', 'greek salad'], id: 'greek_salad' },
  { keywords: ['科布沙拉', 'cobb salad'], id: 'cobb_salad' },
  { keywords: ['卡布里沙拉', '卡普雷塞', 'caprese'], id: 'caprese_salad' },
  { keywords: ['意式烤面包片', '意式烤面包', 'bruschetta', '布鲁斯凯塔'], id: 'bruschetta' },
  { keywords: ['法式咸派', '咸派', 'quiche', '法式蛋派'], id: 'quiche' },
  { keywords: ['班尼迪克蛋', '本尼迪克蛋', 'eggs benedict', '水波蛋吐司'], id: 'eggs_benedict' },
  { keywords: ['欧姆蛋', '欧姆雷特', 'omelette', 'omelet'], id: 'omelette' },
  { keywords: ['松饼', '薄煎饼', '美式松饼', 'pancake', '热香饼'], id: 'pancake' },
  { keywords: ['法式吐司', '西多士', 'french toast'], id: 'french_toast' },

  // ===== 🧁 烘焙甜点(复合菜名,优先于通用\"蛋糕\")=====
  { keywords: ['熔岩巧克力蛋糕', '熔岩蛋糕', 'lava cake'], id: 'lava_cake' },
  { keywords: ['巧克力蛋糕'], id: 'chocolate_cake' },
  { keywords: ['布朗尼', 'brownie'], id: 'brownie' },
  { keywords: ['苹果派', 'apple pie'], id: 'apple_pie' },
  { keywords: ['柠檬挞', '柠檬塔'], id: 'lemon_tart' },
  { keywords: ['水果挞', '水果塔', '蛋挞水果'], id: 'fruit_tart' },
  { keywords: ['焦糖布蕾', '焦糖炖蛋', 'creme brulee'], id: 'creme_brulee' },
  { keywords: ['意式奶冻', '奶冻', 'panna cotta'], id: 'panna_cotta' },
  { keywords: ['慕斯', '巧克力慕斯', 'mousse'], id: 'mousse' },
  { keywords: ['闪电泡芙', '长泡芙', 'eclair'], id: 'eclair' },
  { keywords: ['奶油泡芙', '泡芙', 'cream puff', '泡芙球'], id: 'cream_puff' },
  { keywords: ['玛芬蛋糕', '玛芬', 'muffin'], id: 'muffin' },
  { keywords: ['杯子蛋糕', '纸杯蛋糕', 'cupcake'], id: 'cupcake' },
  { keywords: ['司康', '英式松饼', 'scone'], id: 'scone' },
  { keywords: ['巧克力可颂', '巧克力面包', 'pain au chocolat'], id: 'pain_au_chocolat' },
  { keywords: ['苹果卷', '苹果酥卷', 'apple strudel'], id: 'apple_strudel' },
  { keywords: ['肉桂卷', '肉桂面包', 'cinnamon roll'], id: 'cinnamon_roll' },
  { keywords: ['帕芙洛娃', '蛋白霜蛋糕', 'pavlova'], id: 'pavlova' },
  { keywords: ['意式冰淇淋', '杰拉朵', 'gelato'], id: 'gelato' },
  { keywords: ['阿芙佳朵', '咖啡冰淇淋', 'affogato'], id: 'affogato' },

  // ===== 🍴 西式正餐扩充(复合菜名,优先匹配)=====
  { keywords: ['T骨牛排', 'T骨', 't-bone'], id: 't_bone_steak' },
  { keywords: ['战斧牛排', 'tomahawk'], id: 'tomahawk_steak' },
  { keywords: ['烟熏牛胸肉', '牛胸肉', 'brisket'], id: 'beef_brisket' },
  { keywords: ['手撕猪肉', 'pulled pork'], id: 'pulled_pork' },
  { keywords: ['美式烤肋排', '烤肋排', 'bbq ribs', '猪肋排'], id: 'bbq_ribs' },
  { keywords: ['肉糕', 'meatloaf'], id: 'meatloaf' },
  { keywords: ['肉丸', '意式肉丸', 'meatball'], id: 'meatballs' },
  { keywords: ['牧羊人派', "shepherd's pie", 'shepherds pie'], id: 'shepherds_pie' },
  { keywords: ['炖牛肉锅', 'pot roast'], id: 'pot_roast' },
  { keywords: ['匈牙利炖肉', '匈牙利牛肉', 'goulash'], id: 'goulash' },
  { keywords: ['维也纳炸肉排', '炸肉排', 'schnitzel', '吉列肉排'], id: 'schnitzel' },
  { keywords: ['农舍派', 'cottage pie'], id: 'cottage_pie' },
  { keywords: ['香肠土豆泥', 'bangers'], id: 'bangers_mash' },
  { keywords: ['鸡肉酥皮派', '鸡肉派', 'chicken pot pie'], id: 'chicken_pot_pie' },
  { keywords: ['水牛城辣鸡翅', '水牛城鸡翅', 'buffalo wing'], id: 'buffalo_wings' },
  { keywords: ['烤全鸡', '烤鸡腿全'], id: 'roast_chicken_whole' },
  { keywords: ['帕玛森鸡排', '帕尔马森鸡', 'chicken parmesan', '芝士鸡排'], id: 'chicken_parmesan' },
  { keywords: ['凯撒鸡肉卷', '鸡肉卷凯撒', 'caesar wrap'], id: 'chicken_caesar_wrap' },
  { keywords: ['海鲜派', 'fish pie'], id: 'fish_pie' },
  { keywords: ['香煎鳕鱼', '烤鳕鱼', 'grilled cod', '鳕鱼'], id: 'grilled_cod' },
  { keywords: ['炙烤金枪鱼', '金枪鱼排', 'seared tuna'], id: 'seared_tuna' },
  { keywords: ['烤虾串', '虾串', 'shrimp skewer'], id: 'grilled_shrimp_skewer' },
  { keywords: ['龙虾卷', 'lobster roll'], id: 'lobster_roll' },
  { keywords: ['炸鱼塔可', '鱼肉塔可', 'fish taco'], id: 'fish_taco' },
  { keywords: ['白酒青口贝', '青口贝', '青口', '淡菜', 'mussel'], id: 'mussels_white_wine' },
  { keywords: ['海鲜意面', '海鲜意大利面', 'seafood pasta', 'linguine'], id: 'seafood_linguine' },
  { keywords: ['辣茄酱意面', '阿拉比塔', 'arrabbiata', 'penne'], id: 'penne_arrabbiata' },
  { keywords: ['意式方饺', '意大利方饺', 'ravioli'], id: 'ravioli' },
  { keywords: ['意式馄饨', '托特里尼', 'tortellini'], id: 'tortellini' },
  { keywords: ['培根蛋披萨', '卡邦尼拉披萨', 'carbonara pizza'], id: 'carbonara_pizza' },
  { keywords: ['意大利辣肠披萨', '辣肠披萨', '意式辣肠披萨', 'pepperoni'], id: 'pepperoni_pizza' },
  { keywords: ['夏威夷披萨', 'hawaiian pizza'], id: 'hawaiian_pizza' },
  { keywords: ['披萨饺', '卡尔佐内', 'calzone'], id: 'calzone' },
  { keywords: ['蒜香面包', '蒜蓉面包', 'garlic bread'], id: 'garlic_bread' },
  { keywords: ['佛卡夏', 'focaccia'], id: 'focaccia' },
  { keywords: ['德式碱水结', '碱水结', '蝴蝶饼', 'pretzel'], id: 'pretzel' },
  { keywords: ['法棍', '法式长棍', 'baguette'], id: 'baguette' },
  { keywords: ['夏巴塔', '巧巴达', 'ciabatta'], id: 'ciabatta' },
  { keywords: ['总汇三明治', '俱乐部三明治', 'club sandwich'], id: 'club_sandwich' },
  { keywords: ['blt三明治', 'blt', '培根生菜番茄三明治'], id: 'blt_sandwich' },
  { keywords: ['帕尼尼', 'panini'], id: 'panini' },
  { keywords: ['墨西哥卷饼', '布里托', 'burrito'], id: 'wrap' },
  { keywords: ['塔可', '墨西哥夹饼', 'taco'], id: 'taco' },
  { keywords: ['芝士墨西哥饼', '克萨迪亚', 'quesadilla'], id: 'quesadilla' },
  { keywords: ['墨西哥玉米片', '玉米片', 'nachos'], id: 'nachos' },
  { keywords: ['墨西哥卷', '安吉拉达', 'enchilada'], id: 'enchilada' },
  { keywords: ['辣肉酱豆', '辣豆酱', 'chili con carne', '德州辣酱'], id: 'chili_con_carne' },
  { keywords: ['牛油果酱', '鳄梨酱', 'guacamole'], id: 'guacamole' },
  { keywords: ['鹰嘴豆泥', '鹰嘴豆酱', 'hummus'], id: 'hummus' },
  { keywords: ['中东炸豆丸', '法拉费', '炸鹰嘴豆', 'falafel'], id: 'falafel' },
  { keywords: ['北非番茄蛋', '沙克舒卡', 'shakshuka'], id: 'shakshuka' },
  { keywords: ['希腊旋转烤肉卷', '旋转烤肉', 'gyro'], id: 'gyro' },
  { keywords: ['中东烤肉串', '土耳其烤肉', 'kebab', '卡巴'], id: 'kebab' },
  { keywords: ['希腊茄子千层', '慕沙卡', 'moussaka'], id: 'moussaka' },
  { keywords: ['塔布勒沙拉', '塔博勒', 'tabbouleh'], id: 'tabbouleh' },
  { keywords: ['番茄芝士串', '卡布里串', 'caprese skewer'], id: 'caprese_skewer' },
  { keywords: ['意式蔬菜汤', '蔬菜浓汤', 'minestrone'], id: 'minestrone' },
  { keywords: ['西班牙冷汤', '番茄冷汤', 'gazpacho'], id: 'gazpacho' },
  { keywords: ['扁豆汤', 'lentil soup'], id: 'lentil_soup' },
  { keywords: ['奶油番茄汤', '番茄浓汤', 'tomato soup'], id: 'tomato_soup' },
  { keywords: ['鸡肉面汤', '鸡汤面', 'chicken noodle soup'], id: 'chicken_noodle_soup' },
  { keywords: ['西兰花芝士浓汤', '西兰花浓汤', 'broccoli cheddar'], id: 'broccoli_cheddar_soup' },
  { keywords: ['土豆韭葱汤', '韭葱汤', 'potato leek'], id: 'potato_leek_soup' },
  { keywords: ['凉拌卷心菜', '卷心菜沙拉', 'coleslaw'], id: 'coleslaw' },
  { keywords: ['土豆沙拉', 'potato salad'], id: 'potato_salad' },
  { keywords: ['魔鬼蛋', '酿蛋', 'deviled egg'], id: 'deviled_eggs' },
  { keywords: ['帕尔马火腿', '意式生火腿', 'prosciutto', '风干火腿'], id: 'prosciutto' },
  { keywords: ['烟熏三文鱼', 'smoked salmon'], id: 'smoked_salmon' },
  { keywords: ['布里奶酪', '布里芝士', 'brie'], id: 'brie_cheese' },
  { keywords: ['马苏里拉', '莫扎里拉', 'mozzarella'], id: 'mozzarella' },
  { keywords: ['芝士拼盘', '奶酪拼盘', 'cheese platter'], id: 'cheese_platter' },

  // ===== 🍮 烘焙甜点扩充(复合菜名,优先于通用\"蛋糕\")=====
  { keywords: ['红丝绒蛋糕', '红丝绒', 'red velvet'], id: 'red_velvet_cake' },
  { keywords: ['胡萝卜蛋糕', 'carrot cake'], id: 'carrot_cake' },
  { keywords: ['黑森林蛋糕', '黑森林', 'black forest'], id: 'black_forest_cake' },
  { keywords: ['歌剧院蛋糕', '欧培拉', 'opera cake'], id: 'opera_cake' },
  { keywords: ['岩浆蛋糕'], id: 'lava_cake' },
  { keywords: ['磅蛋糕', '重油蛋糕', 'pound cake'], id: 'pound_cake' },
  { keywords: ['海绵蛋糕', 'sponge cake'], id: 'sponge_cake' },
  { keywords: ['戚风蛋糕', '戚风', 'chiffon'], id: 'chiffon_cake' },
  { keywords: ['巴斯克芝士蛋糕', '巴斯克', 'basque'], id: 'basque_cheesecake' },
  { keywords: ['南瓜派', 'pumpkin pie'], id: 'pumpkin_pie' },
  { keywords: ['碧根果派', '胡桃派', 'pecan pie'], id: 'pecan_pie' },
  { keywords: ['青柠派', '柠檬青柠派', 'key lime'], id: 'key_lime_pie' },
  { keywords: ['香蕉太妃派', '太妃派', 'banoffee'], id: 'banoffee_pie' },
  { keywords: ['翻转苹果挞', '焦糖苹果挞', 'tarte tatin', 'tart tatin'], id: 'tart_tatin' },
  { keywords: ['拿破仑酥', '千层酥', 'mille-feuille', 'millefeuille'], id: 'millefeuille' },
  { keywords: ['巧克力泡芙塔', '泡芙球塔', 'profiterole'], id: 'profiterole' },
  { keywords: ['泡芙塔', '焦糖泡芙塔', 'croquembouche'], id: 'croquembouche' },
  { keywords: ['果仁蜜饼', '巴克拉瓦', 'baklava'], id: 'baklava' },
  { keywords: ['吉事果', '西班牙油条', 'churros', '吉拿棒'], id: 'churros' },
  { keywords: ['法式炸面圈', '贝奈特饼', 'beignet'], id: 'beignet' },
  { keywords: ['意式奶油卷', '卡诺里', 'cannoli'], id: 'cannoli' },
  { keywords: ['英式查佛', '查佛', 'trifle'], id: 'trifle' },
  { keywords: ['太妃布丁', '太妃糖布丁', 'sticky toffee'], id: 'sticky_toffee_pudding' },
  { keywords: ['面包布丁', 'bread pudding'], id: 'bread_pudding' },
  { keywords: ['米布丁', '大米布丁', 'rice pudding'], id: 'rice_pudding' },
  { keywords: ['芙朗', '西班牙布丁', 'flan'], id: 'flan' },
  { keywords: ['糖霜甜甜圈', '釉面甜甜圈', 'glazed donut'], id: 'donut_glazed' },
  { keywords: ['巧克力豆曲奇', '巧克力曲奇', 'chocolate chip cookie'], id: 'chocolate_chip_cookie' },
  { keywords: ['黄油酥饼', '苏格兰酥饼', 'shortbread'], id: 'shortbread' },
  { keywords: ['核桃布朗尼', 'walnut brownie'], id: 'brownie_walnut' },
  { keywords: ['金发布朗尼', '白布朗尼', 'blondie'], id: 'blondie' },
  { keywords: ['蛋白霜饼', '马林糖', 'meringue'], id: 'meringue' },
  { keywords: ['大理石蛋糕', 'marble cake'], id: 'marble_cake' },
  { keywords: ['香蕉面包', '香蕉蛋糕', 'banana bread'], id: 'banana_bread' },
  { keywords: ['柠檬糖霜蛋糕', '柠檬蛋糕', 'lemon drizzle'], id: 'lemon_drizzle_cake' },
  { keywords: ['水果蛋糕', '什锦水果蛋糕', 'fruit cake'], id: 'fruit_cake' },
  { keywords: ['雪葩', '雪芭', 'sorbet'], id: 'sorbet' },
  { keywords: ['冻酸奶', '冰冻酸奶', 'frozen yogurt', 'froyo'], id: 'frozen_yogurt' },
  { keywords: ['香蕉船', 'banana split'], id: 'banana_split' },
  { keywords: ['圣代', '圣代冰淇淋', 'sundae'], id: 'sundae' },
  { keywords: ['芭菲', '酸奶杯', 'parfait'], id: 'parfait' },

  // ===== 🥤 西式饮品扩充 =====
  { keywords: ['热巧克力', '热可可', 'hot chocolate'], id: 'hot_chocolate' },
  { keywords: ['奶昔', 'milkshake'], id: 'milkshake' },
  { keywords: ['柠檬水', '柠檬汁', 'lemonade'], id: 'lemonade' },
  { keywords: ['冰红茶', '冰茶', 'iced tea'], id: 'iced_tea' },
  { keywords: ['浓缩咖啡', '意式浓缩', 'espresso'], id: 'espresso' },
  { keywords: ['澳白', '馥芮白', 'flat white'], id: 'flat_white' },
  { keywords: ['冷萃咖啡', '冷萃', 'cold brew'], id: 'cold_brew' },
  { keywords: ['抹茶拿铁', '抹茶牛奶', 'matcha latte'], id: 'matcha_latte' },
  { keywords: ['红葡萄酒', '红酒', 'red wine'], id: 'wine_red' },
  { keywords: ['白葡萄酒', '白酒葡萄', 'white wine'], id: 'wine_white' },
  { keywords: ['鸡尾酒', 'cocktail', '莫吉托', '玛格丽特酒'], id: 'cocktail' },

  // 经典中式菜(食堂&家常)
  { keywords: ['红烧肉', '东坡肉'], id: 'hongshao_pork' },
  { keywords: ['宫保鸡丁', '宫爆鸡丁', '宫保'], id: 'kungpao_chicken' },
  { keywords: ['麻婆豆腐'], id: 'mapo_tofu' },
  { keywords: ['鱼香肉丝'], id: 'yuxiang_pork' },
  { keywords: ['糖醋里脊', '糖醋肉'], id: 'sweet_sour_pork' },
  { keywords: ['糖醋排骨'], id: 'sweet_sour_ribs' },
  { keywords: ['回锅肉'], id: 'twice_pork' },
  { keywords: ['青椒肉丝', '尖椒肉丝'], id: 'shredded_pork_pepper' },
  { keywords: ['青椒土豆丝', '醋溜土豆丝', '土豆丝'], id: 'green_pepper_potato' },
  { keywords: ['番茄炒蛋', '西红柿炒蛋', '西红柿炒鸡蛋', '番茄炒鸡蛋'], id: 'egg_tomato' },
  { keywords: ['鱼香茄子'], id: 'fish_flavor_eggplant' },
  { keywords: ['红烧茄子', '烧茄子'], id: 'braised_eggplant' },
  { keywords: ['土豆烧牛肉', '土豆炖牛肉'], id: 'potato_beef' },
  { keywords: ['凉拌黄瓜', '拍黄瓜'], id: 'cucumber_salad' },
  { keywords: ['蒜蓉西兰花', '蒜蓉西蓝花'], id: 'garlic_broccoli' },
  { keywords: ['干锅花菜', '干锅菜花'], id: 'dry_pot_cauliflower' },
  { keywords: ['韭菜炒蛋', '韭菜炒鸡蛋'], id: 'scrambled_egg_chive' },
  { keywords: ['猪肉炖白菜', '猪肉白菜', '炖白菜'], id: 'pork_cabbage' },
  { keywords: ['红烧排骨'], id: 'braised_pork_ribs' },

  // 主食类(具体优先)
  { keywords: ['扬州炒饭'], id: 'yangzhou_fried_rice' },
  { keywords: ['蛋炒饭'], id: 'fried_rice' },
  { keywords: ['炒饭', '焖饭'], id: 'fried_rice' },
  { keywords: ['盖饭', '盖浇饭', '卤肉饭'], id: 'rice_bowl' },
  { keywords: ['炒河粉', '炒粉', '干炒牛河'], id: 'fried_rice_noodle' },
  { keywords: ['炒面', '干炒面'], id: 'fried_noodles' },
  { keywords: ['肉酱意面', '博洛尼亚意面', '肉酱面'], id: 'spaghetti_meat' },
  { keywords: ['奶油培根意面', '培根意面', '卡邦尼', '碳烤意面'], id: 'carbonara' },
  { keywords: ['意大利面', '意面', '通心粉', '千层面', 'pasta', 'spaghetti'], id: 'pasta' },
  { keywords: ['乌冬面', '乌龙面'], id: 'udon' },
  { keywords: ['拉面', '日式拉面', '豚骨拉面'], id: 'ramen' },
  { keywords: ['面条', '阳春面', '汤面', '挂面'], id: 'noodles' },
  { keywords: ['皮蛋瘦肉粥'], id: 'pork_congee' },
  { keywords: ['粥', '稀饭', '小米粥', '白粥'], id: 'congee' },
  { keywords: ['杂粮粥', '八宝粥', '五谷粥'], id: 'porridge' },
  { keywords: ['燕麦粥', '燕麦', '麦片'], id: 'oatmeal' },
  { keywords: ['麦片', '燕麦片', 'granola'], id: 'granola' },
  { keywords: ['馄饨', '云吞', '抄手'], id: 'wonton' },
  { keywords: ['煎饺', '锅贴'], id: 'panfried_dumpling' },
  { keywords: ['饺子', '水饺', '蒸饺'], id: 'dumpling' },
  { keywords: ['烧麦', '烧卖'], id: 'shaomai' },
  { keywords: ['小笼包', '小笼汤包', '汤包'], id: 'xiaolongbao' },
  { keywords: ['生煎包', '生煎'], id: 'shengjianbao' },
  { keywords: ['包子', '肉包', '菜包', '豆沙包'], id: 'baozi' },
  { keywords: ['花卷'], id: 'huajuan' },
  { keywords: ['馒头'], id: 'mantou' },
  { keywords: ['煎饼果子', '杂粮煎饼', '山东煎饼'], id: 'jianbing' },
  { keywords: ['肉夹馍', '白吉馍'], id: 'rougamo' },
  { keywords: ['卷饼', '春饼'], id: 'flatbread' },
  { keywords: ['三明治', 'sandwich'], id: 'sandwich' },
  { keywords: ['吐司', '土司', 'toast'], id: 'toast' },
  { keywords: ['贝果', 'bagel'], id: 'bagel' },
  { keywords: ['羊角面包', '可颂', 'croissant'], id: 'croissant' },
  { keywords: ['面包', 'bread'], id: 'bread' },
  { keywords: ['寿司', 'sushi'], id: 'sushi' },
  { keywords: ['饭团', 'onigiri'], id: 'onigiri' },
  { keywords: ['玉米饼', 'tortilla'], id: 'tortilla' },
  { keywords: ['玉米', '甜玉米', '水煮玉米'], id: 'corn' },
  { keywords: ['烤红薯', '烤地瓜'], id: 'baked_sweetpotato' },
  { keywords: ['红薯', '地瓜', '番薯'], id: 'sweetpotato' },
  { keywords: ['芋头'], id: 'taro' },
  { keywords: ['山药'], id: 'yam' },
  { keywords: ['藜麦', 'quinoa'], id: 'quinoa' },
  { keywords: ['辣味方便面', '辣泡面', '火鸡面'], id: 'instant_noodle_spicy' },
  { keywords: ['方便面', '泡面', '康师傅', '统一', '速食面', '汤达人'], id: 'instant_noodle' },
  { keywords: ['自热米饭', '自热饭', '自热锅'], id: 'self_heating_rice' },
  { keywords: ['大碗米饭', '大碗饭'], id: 'rice_large' },
  { keywords: ['小碗米饭', '小碗饭'], id: 'rice_small' },
  { keywords: ['糙米饭', '糙米'], id: 'brownrice' },
  { keywords: ['米饭', '白米饭', '白饭', '蒸饭'], id: 'rice' },

  // 蛋白质 protein
  { keywords: ['牛排', '战斧', '菲力', '西冷'], id: 'steak' },
  { keywords: ['羊肉串', '烤羊肉串', '羊肉串子'], id: 'lamb_skewer' },
  { keywords: ['羊肉', '红烧羊肉', '炖羊肉'], id: 'lamb' },
  { keywords: ['排骨', '蒸排骨', '粉蒸排骨'], id: 'pork_ribs' },
  { keywords: ['烤鸡', '盐焗鸡', '电烤鸡'], id: 'roast_chicken' },
  { keywords: ['鸡翅', '可乐翅', '奥尔良翅'], id: 'chicken_wing' },
  { keywords: ['鸡腿', '鸡腿肉', '香煎鸡腿'], id: 'chicken_thigh' },
  { keywords: ['鸡胸肉', '鸡胸', '白切鸡', '蒸鸡', '水煮鸡'], id: 'chicken' },
  { keywords: ['牛肉', '红烧牛肉', '酱牛肉', '炒牛肉'], id: 'beef' },
  { keywords: ['梅菜扣肉', '扣肉', '猪肉'], id: 'pork' },
  { keywords: ['茶叶蛋'], id: 'tea_egg' },
  { keywords: ['皮蛋', '松花蛋'], id: 'century_egg' },
  { keywords: ['蒸蛋', '蛋羹', '水蒸蛋'], id: 'steamed_egg' },
  { keywords: ['煎蛋', '荷包蛋', '太阳蛋'], id: 'fried_egg' },
  { keywords: ['水煮蛋', '白煮蛋'], id: 'boiled_egg' },
  { keywords: ['炒鸡蛋', '滑蛋'], id: 'scrambled_egg' },
  { keywords: ['鸡蛋'], id: 'egg' },
  { keywords: ['三文鱼', 'salmon'], id: 'salmon' },
  { keywords: ['金枪鱼', '吞拿鱼', 'tuna'], id: 'tuna' },
  { keywords: ['清蒸鱼', '蒸鱼'], id: 'steamfish' },
  { keywords: ['鱼', '红烧鱼', '糖醋鱼', '烤鱼'], id: 'fish' },
  { keywords: ['虾', '白灼虾', '油焖大虾', '盐水虾', '虾仁'], id: 'shrimp' },
  { keywords: ['扇贝'], id: 'scallop' },
  { keywords: ['螃蟹', '大闸蟹'], id: 'crab' },
  { keywords: ['鱿鱼', '铁板鱿鱼', '烤鱿鱼'], id: 'squid' },
  { keywords: ['豆腐干', '香干', '豆干'], id: 'tofu_dry' },
  { keywords: ['腐竹', '豆皮'], id: 'tofu_skin' },
  { keywords: ['豆腐', '家常豆腐', '红烧豆腐', '小葱拌豆腐'], id: 'tofu' },
  { keywords: ['毛豆', '盐水毛豆'], id: 'edamame' },
  { keywords: ['鹰嘴豆'], id: 'chickpea' },
  { keywords: ['扁豆'], id: 'lentils' },
  { keywords: ['希腊酸奶'], id: 'greek_yogurt' },
  { keywords: ['酸奶', '老酸奶'], id: 'yogurt' },
  { keywords: ['芝士', '奶酪', 'cheese'], id: 'cheese' },
  { keywords: ['培根', 'bacon'], id: 'bacon' },
  { keywords: ['火腿肠'], id: 'ham_sausage' },
  { keywords: ['午餐肉'], id: 'luncheon_meat' },
  { keywords: ['香肠', '腊肠'], id: 'sausage' },
  { keywords: ['火腿', 'ham'], id: 'ham' },

  // 蔬菜 veg
  { keywords: ['西兰花', '西蓝花'], id: 'broccoli' },
  { keywords: ['菠菜'], id: 'spinach' },
  { keywords: ['小白菜', '上海青', '油菜'], id: 'bokchoy' },
  { keywords: ['大白菜', '白菜'], id: 'chinese_cabbage' },
  { keywords: ['卷心菜', '包菜', '甘蓝'], id: 'cabbage' },
  { keywords: ['番茄', '西红柿', '圣女果'], id: 'tomato' },
  { keywords: ['黄瓜'], id: 'cucumber' },
  { keywords: ['生菜', '罗马生菜'], id: 'lettuce' },
  { keywords: ['白萝卜'], id: 'white_radish' },
  { keywords: ['胡萝卜', '红萝卜'], id: 'carrot' },
  { keywords: ['土豆', '马铃薯'], id: 'potato' },
  { keywords: ['茄子'], id: 'eggplant' },
  { keywords: ['青椒', '彩椒', '甜椒', '柿子椒'], id: 'bellpepper' },
  { keywords: ['洋葱'], id: 'onion' },
  { keywords: ['金针菇'], id: 'enoki' },
  { keywords: ['香菇', '冬菇'], id: 'shiitake' },
  { keywords: ['蘑菇', '平菇'], id: 'mushroom' },
  { keywords: ['芦笋'], id: 'asparagus' },
  { keywords: ['芹菜'], id: 'celery' },
  { keywords: ['四季豆', '豆角'], id: 'greenbean' },
  { keywords: ['豌豆'], id: 'pea' },
  { keywords: ['玉米粒'], id: 'cornkernel' },
  { keywords: ['韭菜'], id: 'garlic_chive' },
  { keywords: ['海带'], id: 'kelp' },
  { keywords: ['紫菜'], id: 'seaweed' },
  { keywords: ['南瓜'], id: 'pumpkin' },
  { keywords: ['苦瓜'], id: 'bitter_melon' },
  { keywords: ['冬瓜'], id: 'winter_melon' },
  { keywords: ['莲藕', '藕'], id: 'lotus_root' },
  { keywords: ['鸡胸沙拉', '鸡肉沙拉'], id: 'chicken_salad' },
  { keywords: ['凯撒沙拉', 'caesar'], id: 'caesar_salad' },
  { keywords: ['沙拉', '蔬菜沙拉', 'salad'], id: 'salad' },
  { keywords: ['清炒时蔬', '清炒蔬菜', '炒青菜', '清炒'], id: 'stir_fried_veg' },
  { keywords: ['水煮蔬菜', '白灼蔬菜'], id: 'boiledveg' },

  // 水果 fruit
  { keywords: ['苹果'], id: 'apple' },
  { keywords: ['梨', '雪梨', '鸭梨'], id: 'pear' },
  { keywords: ['桃子', '水蜜桃'], id: 'peach' },
  { keywords: ['香蕉'], id: 'banana' },
  { keywords: ['橙子', '橙'], id: 'orange' },
  { keywords: ['橘子', '柑橘', '蜜橘', '砂糖橘'], id: 'tangerine' },
  { keywords: ['柠檬'], id: 'lemon' },
  { keywords: ['柚子', '西柚', '葡萄柚'], id: 'grapefruit' },
  { keywords: ['草莓'], id: 'strawberry' },
  { keywords: ['蓝莓'], id: 'blueberry' },
  { keywords: ['樱桃', '车厘子'], id: 'cherry' },
  { keywords: ['葡萄', '提子'], id: 'grape' },
  { keywords: ['芒果'], id: 'mango' },
  { keywords: ['菠萝', '凤梨'], id: 'pineapple' },
  { keywords: ['猕猴桃', '奇异果'], id: 'kiwi' },
  { keywords: ['西瓜'], id: 'watermelon' },
  { keywords: ['火龙果'], id: 'dragonfruit' },
  { keywords: ['牛油果', '鳄梨'], id: 'avocado' },
  { keywords: ['哈密瓜'], id: 'hami_melon' },
  { keywords: ['木瓜'], id: 'papaya' },
  { keywords: ['龙眼', '桂圆'], id: 'longan' },
  { keywords: ['荔枝'], id: 'lychee' },
  { keywords: ['柿子'], id: 'persimmon' },

  // 油炸 fried
  { keywords: ['巨无霸'], id: 'big_mac' },
  { keywords: ['鸡腿堡', '香辣鸡腿堡', '麦辣鸡腿堡'], id: 'chicken_burger' },
  { keywords: ['芝士汉堡', '芝士堡'], id: 'cheeseburger' },
  { keywords: ['汉堡', 'burger', '麦香'], id: 'burger' },
  { keywords: ['薯条', '炸薯条', 'fries'], id: 'fries' },
  { keywords: ['薯片', '乐事'], id: 'chips' },
  { keywords: ['鸡米花'], id: 'popcorn_chicken' },
  { keywords: ['炸鸡翅', '奥尔良鸡翅'], id: 'fried_chicken_wing' },
  { keywords: ['鸡块', '麦乐鸡'], id: 'chicken_nugget' },
  { keywords: ['炸鸡', '炸鸡腿', '原味鸡', '香辣鸡'], id: 'friedchicken' },
  { keywords: ['披萨', '比萨', 'pizza'], id: 'pizza' },
  { keywords: ['热狗', 'hotdog'], id: 'hotdog' },
  { keywords: ['春卷', '炸春卷'], id: 'spring_roll' },
  { keywords: ['油条'], id: 'youtiao' },
  { keywords: ['可乐饼'], id: 'korokke' },
  { keywords: ['洋葱圈'], id: 'onion_ring' },
  { keywords: ['天妇罗', '天罗'], id: 'tempura' },
  { keywords: ['炸虾', '凤尾虾', '芝士虾'], id: 'fried_shrimp' },
  { keywords: ['炸豆腐'], id: 'fried_tofu' },
  { keywords: ['麻团', '麻球', '芝麻球'], id: 'sesame_ball' },

  // 甜品 sweet & 奶茶
  { keywords: ['黑糖珍珠奶', '黑糖奶茶', '虎纹奶茶'], id: 'brown_sugar_milk' },
  { keywords: ['芝士奶盖', '奶盖茶', '芝士茶'], id: 'cheese_tea' },
  { keywords: ['水果茶', '霸气橙子', '芒果茶'], id: 'fruit_tea' },
  { keywords: ['珍珠奶茶', '波霸奶茶', '珍奶'], id: 'bubbletea' },
  { keywords: ['奶茶'], id: 'milk_tea' },
  { keywords: ['芝士蛋糕'], id: 'cheesecake' },
  { keywords: ['提拉米苏'], id: 'tiramisu' },
  { keywords: ['蛋糕卷', '虎皮卷'], id: 'swiss_roll' },
  { keywords: ['马卡龙', 'macaron'], id: 'macaron' },
  { keywords: ['月饼'], id: 'mooncake' },
  { keywords: ['汤圆', '元宵'], id: 'tangyuan' },
  { keywords: ['蛋挞'], id: 'egg_tart' },
  { keywords: ['华夫', 'waffle'], id: 'waffle' },
  { keywords: ['年糕'], id: 'ricecake' },
  { keywords: ['蛋糕', '奶油蛋糕', '生日蛋糕', '慕斯'], id: 'cake' },
  { keywords: ['冰淇淋', '雪糕', '冰激凌', '甜筒'], id: 'icecream' },
  { keywords: ['冰棍', '冰棒'], id: 'popsicle' },
  { keywords: ['甜甜圈', 'donut'], id: 'donut' },
  { keywords: ['布丁'], id: 'pudding' },
  { keywords: ['曲奇', 'cookie'], id: 'cookie' },
  { keywords: ['饼干'], id: 'biscuit' },
  { keywords: ['巧克力', 'chocolate'], id: 'chocolate' },
  { keywords: ['棉花糖'], id: 'marshmallow' },
  { keywords: ['糖果', '硬糖', '软糖'], id: 'candy' },

  // 饮料 drink
  { keywords: ['焦糖玛奇朵', '玛奇朵'], id: 'caramel_macchiato' },
  { keywords: ['摩卡', 'mocha'], id: 'mocha' },
  { keywords: ['拿铁', 'latte', '燕麦拿铁'], id: 'latte' },
  { keywords: ['卡布奇诺'], id: 'cappuccino' },
  { keywords: ['美式咖啡', '美式', '黑咖啡', 'americano'], id: 'americano' },
  { keywords: ['咖啡', 'coffee'], id: 'coffee' },
  { keywords: ['果汁', '橙汁', '苹果汁', 'juice'], id: 'juice' },
  { keywords: ['豆浆'], id: 'soymilk' },
  { keywords: ['牛奶', '纯牛奶', 'milk'], id: 'milk' },
  { keywords: ['椰子水', '椰青'], id: 'coconut_water' },
  { keywords: ['思慕昔', '果昔', 'smoothie'], id: 'smoothie' },
  { keywords: ['可乐', '可口可乐', '百事可乐', 'cola'], id: 'cola' },
  { keywords: ['雪碧', '芬达', '汽水', '七喜'], id: 'sprite' },
  { keywords: ['红牛', '功能饮料', '能量饮料', '东鹏特饮'], id: 'energy_drink' },
  { keywords: ['脉动', '宝矿力', '尖叫', '佳得乐', '运动饮料'], id: 'sports_drink' },
  { keywords: ['啤酒'], id: 'beer' },
  { keywords: ['茶', '绿茶', '红茶', '乌龙茶'], id: 'tea' },

  // 汤类
  { keywords: ['鱼丸汤', '鱼丸'], id: 'fish_ball_soup' },
  { keywords: ['紫菜蛋花汤', '紫菜汤', '蛋花汤'], id: 'egg_drop_soup' },
  { keywords: ['番茄蛋汤', '番茄鸡蛋汤', '西红柿蛋汤'], id: 'tomato_egg_soup' },

  // 复合大类(兜底)
  { keywords: ['火锅', '麻辣火锅', '清汤火锅'], id: 'hotpot' },
  { keywords: ['烧烤', '烤串', '撸串'], id: 'bbq_skewer' },
];

/**
 * 把百度返回的菜名 → 数据库 id
 * 命中关键词就返回对应 id,否则返回 null(不伪造)
 */
function mapDishNameToId(dishName) {
  if (!dishName) return null;
  const name = String(dishName).toLowerCase();
  // 跳过百度的"非菜"返回
  if (name.includes('非菜') || name.includes('无法识别')) return null;
  for (const item of DISH_KEYWORD_MAP) {
    for (const kw of item.keywords) {
      if (name.includes(kw.toLowerCase())) {
        return item.id;
      }
    }
  }
  return null;
}

/**
 * 通过百度菜品识别 API 识别图像中的食物
 * @param {string} base64Image - data:image/...;base64,XXX 格式
 * @returns {Promise<{success, items, mode, message}>}
 */
export async function recognizeFood(base64Image) {
  // 提取 base64 部分
  const match = base64Image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) {
    return { success: false, items: [], mode: 'error', message: '图片格式无效' };
  }
  const base64Data = match[2];

  // 未配置 key — 降级到 mock 模式
  if (!HAS_KEY) {
    return mockRecognize();
  }

  try {
    const token = await getBaiduToken();
    const url = `https://aip.baidubce.com/rest/2.0/image-classify/v2/dish?access_token=${token}`;
    // 百度要求:image 参数是 URLEncode 后的 base64
    const params = new URLSearchParams();
    params.append('image', base64Data);
    params.append('top_num', '5');
    params.append('filter_threshold', '0.7'); // 置信度阈值,低于此值不返回

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const data = await res.json();

    if (data.error_code) {
      console.error('[recognize] 百度 API 错误:', data.error_code, data.error_msg);
      return {
        success: false,
        items: [],
        mode: 'api-error',
        message: `百度 API 错误(${data.error_code}): ${data.error_msg}`
      };
    }

    // 百度返回结构:{ result: [ { name, calorie, probability, has_calorie }, ... ] }
    const results = Array.isArray(data.result) ? data.result : [];
    if (results.length === 0) {
      return {
        success: true,
        items: [],
        mode: 'baidu-dish',
        message: '未能识别图中食物,请手动添加'
      };
    }

    // 把百度返回的菜名映射到我们数据库的 id
    const mapped = [];
    const seenIds = new Set();
    for (const r of results) {
      const id = mapDishNameToId(r.name);
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        mapped.push({
          id,
          confidence: Math.round((r.probability || 0.8) * 100) / 100,
          servings: 1, // 百度不返回份数,默认 1
          originalName: r.name // 保留原始菜名作参考
        });
      }
    }

    // 如果一个都没映射成功,返回友好提示
    if (mapped.length === 0) {
      const rawNames = results.slice(0, 3).map(r => r.name).join('、');
      return {
        success: true,
        items: [],
        mode: 'baidu-dish',
        message: `百度识别为「${rawNames}」,但暂未在数据库中找到对应营养数据。请手动搜索添加相似食材。`
      };
    }

    return {
      success: true,
      items: mapped,
      mode: 'baidu-dish',
      message: `百度菜品识别完成,识别到 ${mapped.length} 种食物`
    };
  } catch (err) {
    console.error('[recognize] 调用百度 API 异常:', err.message);
    return {
      success: false,
      items: [],
      mode: 'api-error',
      message: '识别失败,请手动添加食物。错误:' + err.message
    };
  }
}

/**
 * Mock 模式:返回示例识别结果(未配置 key 时)
 */
function mockRecognize() {
  const mockResults = [
    { id: 'egg', confidence: 0.88, servings: 2 },
    { id: 'toast', confidence: 0.92, servings: 1 },
    { id: 'milk', confidence: 0.75, servings: 1 }
  ];
  return {
    success: true,
    items: mockResults,
    mode: 'mock',
    message: '⚠️ 当前为演示模式(未配置百度 API key)。返回的是示例数据 — 在 .env 中填入 BAIDU_API_KEY 和 BAIDU_SECRET_KEY 即可启用真实识别。'
  };
}

/**
 * 把识别结果聚合成完整营养信息
 */
export function aggregateNutrition(items) {
  const totals = { cal: 0, p: 0, c: 0, f: 0, fiber: 0, na: 0, ca: 0, fe: 0, vc: 0 };
  const detailed = [];
  for (const item of items) {
    const food = getFoodById(item.id);
    if (!food) continue;
    const servings = item.servings || 1;
    const scaled = {
      id: item.id,
      zh: food.zh,
      en: food.en,
      cat: food.cat,
      unit: food.unit,
      servings,
      cal: Math.round(food.cal * servings),
      p: +(food.p * servings).toFixed(1),
      c: +(food.c * servings).toFixed(1),
      f: +(food.f * servings).toFixed(1),
      fiber: +(food.fiber * servings).toFixed(1),
      na: Math.round(food.na * servings),
      ca: Math.round(food.ca * servings),
      fe: +(food.fe * servings).toFixed(2),
      vc: Math.round(food.vc * servings),
    };
    for (const k of Object.keys(totals)) {
      totals[k] += scaled[k];
    }
    detailed.push(scaled);
  }
  totals.cal = Math.round(totals.cal);
  totals.p = +totals.p.toFixed(1);
  totals.c = +totals.c.toFixed(1);
  totals.f = +totals.f.toFixed(1);
  totals.fiber = +totals.fiber.toFixed(1);
  totals.na = Math.round(totals.na);
  totals.ca = Math.round(totals.ca);
  totals.fe = +totals.fe.toFixed(2);
  totals.vc = Math.round(totals.vc);
  return { totals, detailed };
}

export const apiStatus = {
  hasKey: HAS_KEY,
  mode: HAS_KEY ? 'production (百度菜品识别)' : 'demo (mock)'
};
