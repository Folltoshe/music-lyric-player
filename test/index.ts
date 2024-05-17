import { LyricParser, LyricPlayer } from '../src'

const parser = new LyricParser()

const lyricInfo = parser.parseLyric({
  original: `
  [00:14.881]当我好奇地乱敲着黑白的琴键
  [00:18.619]当我躲在房间乐极忘形地表演
  [00:22.19]你微笑的双眼  是否当时早有预感
  [00:27.104]看到了今天
  [00:29.341]当我没日没夜听着最爱的唱片
  [00:32.919]当我书本每一页都画满了和弦
  [00:36.356]你从不曾熄灭  我天真的火焰
  [00:39.841]不怪我在浪费时间
  [00:44.641]是你的无条件  成就了这一切
  [00:51.809]是你让我看见
  [00:55.276]天空没有极限  我的未来无边
  [01:02.481]破茧的我会飞向更蔚蓝的明天
  [01:09.537]前方路若遥远  回头看看从前
  [01:16.705]看看镜子里的你带着曾经的我
  [01:24.513]已走了多远
  [01:28.353]多少次我心里浮现失控的画面
  [01:31.965]多少冷言冷语汹涌地来到耳边
  [01:35.599]多少夜失眠  你是否也曾度日如年
  [01:40.512]差一点沦陷
  [01:42.793]当我落寞地遥望着再来的春天
  [01:46.401]当我默默地把眼泪流在心里面
  [01:49.925]当一切违愿  谁不曾埋怨
  [01:54.452]进退都在一念间
  [01:58.49]但你却无条件  扛下了这一切
  [02:05.281]是你让我看见
  [02:08.859]天空没有极限  我的未来无边
  [02:15.892]破茧的我会飞向更蔚蓝的明天
  [02:22.945]前方路若遥远  回头看看从前
  [02:30.113]看看镜子里的你带着曾经的我
  [02:38.177]已走了多远
  [02:45.409]走了多远  多远  有多远  有多远
  [03:09.537]看看从前  我已走了多远
  [03:23.681]我的世界  我看不到边界
  [03:38.471]天空没有极限  我的未来无边
  [03:43.797]破茧的我会飞向更蔚蓝的明天
  [03:49.99]前方路若遥远  回头看看从前
  [03:56.293]看看镜子里的你带着曾经的我
  [04:04.266]已走了多远
  [04:05.537]多少次我心里浮现失控的画面
  [04:09.548]多少冷言冷语汹涌地来到耳边
  [04:13.343]多少夜失眠  你是否也曾度日如年
  [04:18.87]差一点沦陷
  [04:20.346]当我落寞地遥望着再来的春天
  [04:23.863]当我默默地把眼泪流在心里面
  [04:27.580]当一切违愿  抬头看看蓝天
  [04:32.584]没有极限
  `,
  dynamic: `
  [00:14.881]<0,375>当<376,233>我<609,237>好<846,198>奇<1044,233>地<1277,199>乱<1477,251>敲<1729,179>着<1908,234>黑<2143,236>白<2379,215>的<2595,431>琴<3026,300>键
  [00:18.619]<0,190>当<191,197>我<388,235>躲<624,216>在<840,216>房<1057,217>间<1274,195>乐<1470,254>极<1724,216>忘<1941,233>形<2174,224>地<2398,426>表<2825,295>演
  [00:22.19]<0,190>你<190,196>微<387,199>笑<586,216>的<802,433>双<1236,252>眼  <1723,297>是<2020,251>否<2272,262>当<2534,251>时<2786,551>早<3337,350>有<3688,593>预<4281,434>感
  [00:27.104]<0,199>看<199,233>到<433,685>了<1118,378>今<1497,423>天
  [00:29.341]<0,215>当<216,179>我<395,236>没<631,234>日<866,253>没<1119,215>夜<1335,214>听<1550,181>着<1731,199>最<1930,250>爱<2181,254>的<2435,431>唱<2866,341>片
  [00:32.919]<0,235>当<235,216>我<452,232>书<685,236>本<921,178>每<1100,216>一<1316,233>页<1549,217>都<1767,216>画<1984,197>满<2181,235>了<2417,432>和<2850,314>弦
  [00:36.356]<0,216>你<216,160>从<377,216>不<593,209>曾<802,216>熄<1018,629>灭  <1648,216>我<1865,235>天<2100,233>真<2334,260>的<2594,408>火<3003,256>焰
  [00:39.841]<0,323>不<324,588>怪<912,591>我<1504,425>在<1929,216>浪<2146,432>费<2579,513>时<3093,1193>间
  [00:44.641]<0,440>是<440,214>你<655,216>的<872,530>无<1402,407>条<1809,847>件  <3776,177>成<3954,179>就<4134,469>了<4604,414>这<5018,389>一<5407,1247>切
  [00:51.809]<0,359>是<359,195>你<555,452>让<1007,431>我<1439,451>看<1890,1116>见
  [00:55.276]<0,216>天<217,231>空<449,409>没<859,356>有<1216,526>极<1742,1298>限  <3609,225>我<3834,207>的<4042,358>未<4400,433>来<4834,567>无<5402,1409>边
  [01:02.481]<0,216>破<217,216>茧<434,368>的<803,457>我<1261,407>会<1668,847>飞<2516,533>向<3049,394>更<3444,450>蔚<3894,543>蓝<4438,612>的<5051,430>明<5482,1316>天
  [01:09.537]<0,354>前<355,209>方<564,358>路<923,452>若<1375,413>遥<1789,1606>远  <3594,269>回<3864,224>头<4088,408>看<4496,466>看<4963,397>从<5360,1614>前
  [01:16.705]<0,257>看<258,231>看<490,397>镜<887,426>子<1313,456>里<1770,804>的<2574,784>你<3358,234>带<3593,367>着<3961,433>曾<4395,533>经<4928,451>的<5379,2363>我
  [01:24.513]<0,463>已<463,209>走<672,179>了<852,332>多<1185,1885>远
  [01:28.353]<0,347>多<348,199>少<547,234>次<782,214>我<997,234>心<1232,225>里<1457,215>浮<1673,228>现<1901,214>失<2116,198>控<2314,242>的<2557,390>画<2947,379>面
  [01:31.965]<0,295>多<296,198>少<494,272>冷<767,215>言<982,218>冷<1200,233>语<1434,197>汹<1632,234>涌<1867,180>地<2047,233>来<2280,254>到<2535,432>耳<2967,370>边
  [01:35.599]<0,251>多<252,215>少<468,217>夜<685,358>失<1044,352>眠  <1649,197>你<1847,198>是<2046,216>否<2263,234>也<2497,217>曾<2715,628>度<3343,334>日<3677,533>如<4210,318>年
  [01:40.512]<0,289>差<289,218>一<507,547>点<1055,442>沦<1497,486>陷
  [01:42.793]<0,216>当<217,208>我<426,231>落<658,218>寞<876,216>地<1093,216>遥<1309,223>望<1533,234>着<1767,209>再<1976,198>来<2175,195>的<2371,451>春<2823,463>天
  [01:46.401]<0,216>当<217,215>我<432,234>默<667,251>默<918,216>地<1135,188>把<1324,210>眼<1534,239>泪<1774,216>流<1991,271>在<2262,236>心<2498,295>里<2794,407>面
  [01:49.925]<0,210>当<210,239>一<450,233>切<683,433>违<1117,471>愿  <1588,387>谁<1976,224>不<2200,350>曾<2551,254>埋<2805,1378>怨
  [01:54.452]<0,198>进<198,197>退<396,352>都<748,260>在<1009,406>一<1415,414>念<1830,1253>间
  [01:58.49]<0,476>但<476,236>你<713,332>却<1046,406>无<1453,457>条<1911,823>件  <3870,179>扛<4049,216>下<4266,278>了<4544,432>这<4977,469>一<5446,1272>切
  [02:05.281]<0,278>是<279,287>你<567,531>让<1099,433>我<1533,450>看<1983,1151>见
  [02:08.859]<0,189>天<190,180>空<370,316>没<686,432>有<1119,524>极<1643,711>限  <3417,235>我<3653,234>的<3887,388>未<4276,432>来<4708,459>无<5167,1389>边
  [02:15.892]<0,217>破<217,233>茧<450,352>的<803,370>我<1173,532>会<1705,802>飞<2508,475>向<2984,454>更<3438,421>蔚<3860,496>蓝<4357,550>的<4907,393>明<5300,1559>天
  [02:22.945]<0,331>前<331,216>方<548,332>路<881,352>若<1233,515>遥<1749,1641>远  <3624,278>回<3902,252>头<4155,396>看<4551,396>看<4948,425>从<5374,1664>前
  [02:30.113]<0,331>看<332,233>看<565,336>镜<901,449>子<1351,451>里<1803,783>的<2587,575>你<3162,388>带<3551,433>着<3984,449>曾<4434,500>经<4934,429>的<5363,1995>我
  [02:38.177]<0,491>已<491,296>走<788,353>了<1142,450>多<1592,1158>远
  [02:45.409]<0,391>走<392,224>了<616,424>多<1040,1250>远  <11441,432>多<11874,1234>远  <14679,198>有<14877,163>多<15040,1170>远  <18256,197>有<18453,353>多<18806,1224>远
  [03:09.537]<0,533>看<533,782>看<1315,414>从<1730,1568>前  <7230,217>我<7447,215>已<7663,396>走<8059,522>了<8582,550>多<9132,2002>远
  [03:23.681]<0,451>我<451,704>的<1156,749>世<1905,2241>界  <7405,252>我<7658,239>看<7897,371>不<8269,451>到<8721,477>边<9198,2192>界
  [03:38.471]<0,162>天<163,153>空<316,335>没<651,413>有<1065,449>极<1515,1124>限  <3604,172>我<3776,141>的<3918,334>未<4252,524>来<4776,335>无<5112,213>边
  [03:43.797]<0,396>破<396,215>茧<612,218>的<830,215>我<1046,217>会<1263,195>飞<1459,271>向<1731,217>更<1948,316>蔚<2264,510>蓝<2775,216>的<2992,426>明<3418,1514>天
  [03:49.99]<0,198>前<198,182>方<380,393>路<774,489>若<1263,450>遥<1714,1414>远  <3516,217>回<3734,216>头<3950,432>看<4383,450>看<4834,433>从<5267,1530>前
  [03:56.293]<0,198>看<199,156>看<355,295>镜<650,531>子<1182,408>里<1590,907>的<2498,604>你<3102,335>带<3438,379>着<3818,483>曾<4301,495>经<4796,449>的<5246,2012>我
  [04:04.266]<0,180>已<180,162>走<342,187>了<530,181>多<711,560>远
  [04:05.537]<0,216>多<217,278>少<495,171>次<667,243>我<911,298>心<1209,286>里<1496,297>浮<1793,296>现<2090,271>失<2362,269>控<2631,341>的<2973,406>画<3379,378>面
  [04:09.548]<0,278>多<279,253>少<532,252>冷<785,198>言<983,197>冷<1180,225>语<1406,242>汹<1649,235>涌<1885,233>地<2118,253>来<2372,278>到<2650,388>耳<3039,531>边
  [04:13.343]<0,234>多<234,174>少<408,197>夜<605,197>失<803,506>眠  <1309,279>你<1588,270>是<1859,216>否<2075,216>也<2292,233>曾<2525,550>度<3075,533>日<3609,431>如<4041,485>年
  [04:18.87]<0,259>差<259,201>一<461,745>点<1206,370>沦<1576,683>陷
  [04:20.346]<0,317>当<318,233>我<551,216>落<767,217>寞<985,216>地<1201,208>遥<1409,224>望<1634,209>着<1844,233>再<2077,261>来<2338,254>的<2593,366>春<2960,316>天
  [04:23.863]<0,353>当<354,235>我<589,250>默<840,217>默<1057,197>地<1255,197>把<1453,235>眼<1688,198>泪<1886,216>流<2103,233>在<2336,279>心<2616,424>里<3040,296>面
  [04:27.580]<0,233>当<233,209>一<442,216>切<659,180>违<839,216>愿  <1055,235>抬<1290,260>头<1551,232>看<1783,254>看<2037,722>蓝<2760,323>天
  [04:32.584]<0,666>没<667,290>有<957,475>极<1433,685>限
  `,
})

const player = new LyricPlayer({
  lyricInfo,
  onSetLyric(info) {
    console.log('onSetLyric', info)
  },
  onPlay(line, info) {
    console.log('onPlay', line, info)
  },
})

player.play()
