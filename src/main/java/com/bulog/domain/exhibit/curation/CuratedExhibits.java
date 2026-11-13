package com.bulog.domain.exhibit.curation;

import java.util.List;

/**
 * 수집 대상 유물 24개. 순서가 곧 카드 번호이자 관람 순서다.
 * 사진과 설명은 부천시박물관 3D 전시실 → 누리집 소장품 → 소장품 도록 → e뮤지엄 순서로 가져왔다.
 * 유물을 바꾸면 이 목록만 고치면 된다.
 */
public final class CuratedExhibits {

    public static final List<CuratedExhibit> ALL = List.of(
            new CuratedExhibit(
                    "ongi1-faith-jar",
                    "신앙항아리",
                    "근대",
                    "부천의 '점말'은 병인박해를 피해 천주교인들이 모여살면서 옹기를 만들던 곳이다. 이곳에서 만들어진 옹기에는 신앙심을 표현하는 십자가가 그려진 경우가 많이 발견된다. 십자가를 숨기기 위해 쌀미(米)자 처럼 표현했다.",
                    "/images/exhibits/ongi1-faith-jar.jpg",
                    "부천시립박물관",
                    "부천시박물관 3D 전시실, 부천시박물관 누리집",
                    "https://my.matterport.com/show/?m=ckQy8JMv3Xj",
                    "옹기1전시실",
                    1
            ),
            new CuratedExhibit(
                    "ongi1-jubyeong",
                    "주병",
                    "조선",
                    "주로 술이나 물을 담아 쓰던 주병이다. 주호(酒壺)라고도 한다. 목이 길어 병의 손잡이 역할을 겸하였고 입술은 술이나 물을 따르고 나서 흘러내리는 것을 막아주는 기능을 한다.",
                    "/images/exhibits/ongi1-jubyeong.jpg",
                    "부천시립박물관",
                    "부천시박물관 누리집",
                    "https://www.bcmuseum.or.kr/ko/collection/",
                    "옹기1전시실",
                    2
            ),
            new CuratedExhibit(
                    "ongi1-seongju-danji",
                    "성주단지",
                    "조선",
                    "성주는 집(건물)의 신이다. 새 집을 지으면 집을 잘 지켜주고 복이 깃들게 해달라는 바람을 담아 성주를 모시고 제사를 지낸다.",
                    "/images/exhibits/ongi1-seongju-danji.jpg",
                    "부천시립박물관",
                    "부천시박물관 누리집",
                    "https://www.bcmuseum.or.kr/ko/collection/",
                    "옹기1전시실",
                    3
            ),
            new CuratedExhibit(
                    "ongi1-flower-jar",
                    "화초문항아리",
                    "근대",
                    "충청도항아리는 입지름과 밑지름의 크기가 같은 것이 특징으로, 배는 서울·경기 지방 것보다 더 불룩한 형태이다. 다른 지역의 옹기보다 목이 높으며 형태가 날씬하다.",
                    "/images/exhibits/ongi1-flower-jar.jpg",
                    "부천시립박물관",
                    "부천시박물관 3D 전시실, 부천시박물관 누리집",
                    "https://my.matterport.com/show/?m=ckQy8JMv3Xj",
                    "옹기1전시실",
                    4
            ),
            new CuratedExhibit(
                    "ongi2-kongnamul-siru",
                    "콩나물시루",
                    "일제강점기",
                    "긴 겨울 동안 먹을 수 있는 채소로 콩나물을 기르는 시루이다. 일반 시루에 비해 몸체를 길게 만들고 물받침으로 확독을 받혀 콩나물 재배에 이용했다.",
                    "/images/exhibits/ongi2-kongnamul-siru.jpg",
                    "부천시립박물관",
                    "부천시박물관 누리집",
                    "https://www.bcmuseum.or.kr/ko/collection/",
                    "옹기2전시실",
                    5
            ),
            new CuratedExhibit(
                    "ongi2-pattern-jar",
                    "문양항아리",
                    "근대",
                    "유약을 바른 후 손으로 원하는 모양을 직접 그리는 '수화문'은 거의 모든 옹기에서 볼 수 있다. 지그재그문이 그려진 오지독으로 뚜껑과의 조화가 잘 어우러진 항아리이다.",
                    "/images/exhibits/ongi2-pattern-jar.jpg",
                    "부천시립박물관",
                    "부천시박물관 누리집",
                    "https://www.bcmuseum.or.kr/ko/collection/",
                    "옹기2전시실",
                    6
            ),
            new CuratedExhibit(
                    "ongi2-sojutgori",
                    "소줏고리",
                    "조선",
                    "양조주를 가마에 붓고 그 가마 위에 소줏고리를 올려놓습니다. 그리고 나서 양조주를 가열하면 생기는 '증류원리'를 이용해서 소주를 제작하는 옹기입니다.",
                    "/images/exhibits/ongi2-sojutgori.jpg",
                    "부천시립박물관",
                    "부천시박물관 3D 전시실",
                    "https://my.matterport.com/show/?m=TxszNY2dSqx",
                    "옹기2전시실",
                    7
            ),
            new CuratedExhibit(
                    "ongi2-janggun",
                    "장군",
                    "조선",
                    "장군은 물, 술, 간장, 오줌 등 액체를 담는 그릇이다. 장군의 크기는 일정하지 않으나 큰 것은 지름 30cm, 길이 60cm 정도로서 서말의 오줌이 들어가며, 작은 것은 한 말들이도 있다.",
                    "/images/exhibits/ongi2-janggun.jpg",
                    "부천시립박물관",
                    "부천시박물관 3D 전시실, 부천시박물관 누리집",
                    "https://my.matterport.com/show/?m=TxszNY2dSqx",
                    "옹기2전시실",
                    8
            ),
            new CuratedExhibit(
                    "local-half-moon-knife",
                    "반달돌칼",
                    "선사시대",
                    "곡식의 이삭을 따는 도구로서 몸체 가운데의 두 개의 구멍에 끈을 끼워서 그 사이에 손을 넣어 잡고 사용하였다. 이삭을 자르기 편하도록 한 쪽 날을 더 날카롭게 갈았으며, 대량수확이 되지 않았던 당시에 먼저 익은 이삭부터 하나씩 딸 때 이용하였다.",
                    "/images/exhibits/local-half-moon-knife.jpg",
                    "부천향토역사관",
                    "부천시박물관 3D 전시실",
                    "https://my.matterport.com/show/?m=9aTbyhPvvsB",
                    "부천향토역사관",
                    9
            ),
            new CuratedExhibit(
                    "local-spindle-whorl",
                    "가락바퀴",
                    "선사시대",
                    "'방추차'라고도 하며 선사시대 옷감을 짜는 기술을 알 수 있는 것으로, 중앙 구멍에 긴 막대를 끼워 넣고 축을 돌리는 방법으로 실을 꼬아서 뽑는 데 사용하였으며 후에 물레로 발전하게 되었다.",
                    "/images/exhibits/local-spindle-whorl.jpg",
                    "부천향토역사관",
                    "부천시박물관 3D 전시실",
                    "https://my.matterport.com/show/?m=9aTbyhPvvsB",
                    "부천향토역사관",
                    10
            ),
            new CuratedExhibit(
                    "local-inhwamun-togibyeong",
                    "인화문 토기병",
                    "통일신라",
                    "무늬가 새겨진 도장으로 토기의 표면에 무늬를 찍은 토기를 말하며, 통일신라시대의 대표적인 토기이다. 주로 무덤 및 절터, 궁터 등의 생활유적에서 출토되며 부장품, 뼈항아리 이외의 일상용기로도 많이 사용되었다. 6세기 말 전성기를 이루면서 통일신라시대 말까지 제작되었으며, 고려시대로 이어지면서 점점 무늬가 생략되었다.",
                    "/images/exhibits/local-inhwamun-togibyeong.jpg",
                    "부천향토역사관",
                    "부천시박물관 3D 전시실",
                    "https://my.matterport.com/show/?m=9aTbyhPvvsB",
                    "부천향토역사관",
                    11
            ),
            new CuratedExhibit(
                    "local-cheonghwa-hap",
                    "청화백자연화문합",
                    null,
                    "청화 안료를 사용하여 연꽃 문양을 그린 백자합이다. 몸체에는 연잎을 뚜껑에는 연밥을 표현하였다.",
                    "/images/exhibits/local-cheonghwa-hap.jpg",
                    "부천향토역사관",
                    "부천시박물관 3D 전시실",
                    "https://my.matterport.com/show/?m=9aTbyhPvvsB",
                    "부천향토역사관",
                    12
            ),
            new CuratedExhibit(
                    "europe-meissen-plate",
                    "마이센 마크가 있는 접시 액자",
                    "21세기 독일",
                    "서양 최초로 경질자기를 만들어 내는 데 성공한 1710년 설립된 독일 마이센은 점차 유럽 전역으로 자기 제작 기술이 전파되어가자 자사 상품을 인증하기 위해 자신만의 문양을 만들었다. 1710년 설립 이후 초창기에는 독일 아우구스투스 왕의 머리 글자인 'AR'을 식기에 새겼다. 1723년부터는 마이센이 속한 작센 지방의 문양인 쌍칼을 그려넣고 있는데, 이러한 역대 마이센의 문양 변천사를 한 눈에 볼 수 있는 도자기 화판이다. 한편 마이센은 색채 전문가 헤롤트와 조각가인 켄들러에 의해 다양한 색채와 형태의 도자기를 생산하며 지금까지도 그 명성을 유지하고 있다.",
                    "/images/exhibits/europe-meissen-plate.jpg",
                    "부천시립박물관",
                    "부천시박물관 누리집",
                    "https://www.bcmuseum.or.kr/ko/collection/",
                    "유럽자기전시실",
                    13
            ),
            new CuratedExhibit(
                    "europe-sevres-vase",
                    "세브르 평화의 화병",
                    "19세기 프랑스",
                    "1873년 세브르 작품목록에 한쌍(2개)이였던것으로 나타난다. 세브르의 전형적인 컬러인 블루와 평화의 상징인 비둘기, 각기 다른 꽃을 *백토중첩기법으로 3면에 그려넣었다. *백토중첩기법: 백토를 몇 겹씩 얇게 펴 발라서 모양을 만들어 내는 기법",
                    "/images/exhibits/europe-sevres-vase.jpg",
                    "부천시립박물관",
                    "부천시박물관 3D 전시실",
                    "https://my.matterport.com/show/?m=9tNpkxNdyTi",
                    "유럽자기전시실",
                    14
            ),
            new CuratedExhibit(
                    "europe-worcester-vase",
                    "우스터 '물안개 피는 호수' 화병",
                    "19세기 영국",
                    "화병안의 그림은 한정판으로 사진의뢰를 받아 로열우스터에서 만든 작품이다. 호수의 경치를 파스텔톤으로 아름답게 표현했으며 양손잡이에 인물 부조가 장식되어 있다.",
                    "/images/exhibits/europe-worcester-vase.jpg",
                    "부천시립박물관",
                    "부천시박물관 누리집, 부천시박물관 3D 전시실",
                    "https://my.matterport.com/show/?m=9tNpkxNdyTi",
                    "유럽자기전시실",
                    15
            ),
            new CuratedExhibit(
                    "europe-flora-danica",
                    "로열 코펜하겐 플로라다니카 디너서비스",
                    "19세기 덴마크",
                    "덴마크에서 자라는 수천종의 야생식물을 그려넣은 로열 코펜하겐의 대표작품 '플로라다니카'시리즈의 디너서비스이다. 1789년 러시아 황후인 예카테리나 2세에게 선물하기 위해 특별 제작되었다. 전체 세트가 각기 다른 꽃으로 그려져 있고 자세히 보면 야생화 뿌리까지 그려져 있는 귀한 작품이다.",
                    "/images/exhibits/europe-flora-danica.jpg",
                    "부천시립박물관",
                    "부천시박물관 누리집, 부천시박물관 3D 전시실",
                    "https://my.matterport.com/show/?m=9tNpkxNdyTi",
                    "유럽자기전시실",
                    16
            ),
            new CuratedExhibit(
                    "edu-gwageo-answer",
                    "과거시험답안지",
                    "조선",
                    "조선시대에는 관리로 등용하기 위해서 과거시험을 보았다. 시험장에서 시험 감독관이 시제를 공포하면 응시자들은 이와 같은 답안지를 작성하였다. 답안지 오른쪽 하단에는 응시자의 신상명세가 적혀 있어 채점시에는 이 부분을 접어서 채점자가 보지 못하도록 하였다. 시험에 붙었을 때는 답안지에 붉은 먹으로 당이란 글자를, 떨어졌을 경우에는 락이란 글자를 크게 써 놓았다.",
                    "/images/exhibits/edu-gwageo-answer.jpg",
                    "부천시립박물관",
                    "부천시박물관 누리집, 부천시박물관 3D 전시실",
                    "https://my.matterport.com/show/?m=HsCkG1jEQ2D",
                    "교육전시실",
                    17
            ),
            new CuratedExhibit(
                    "edu-high-korean",
                    "고등국어",
                    "광복이후",
                    "『고등국어 현대문감(高等國語 現代門鑑)』은 1949년 11월 1일 대학출판사에서 펴낸 국어 교과서로, 조윤제가 지었다.",
                    "/images/exhibits/edu-high-korean.jpg",
                    "부천시립박물관",
                    "부천시박물관 3D 전시실, e뮤지엄",
                    "https://my.matterport.com/show/?m=HsCkG1jEQ2D",
                    "교육전시실",
                    18
            ),
            new CuratedExhibit(
                    "edu-school-bell",
                    "학교종",
                    "광복이후",
                    "과거 학교에서 사용하던 종이다.",
                    "/images/exhibits/edu-school-bell.jpg",
                    "부천시립박물관",
                    "부천시박물관 3D 전시실, 부천시박물관 누리집",
                    "https://my.matterport.com/show/?m=HsCkG1jEQ2D",
                    "교육전시실",
                    19
            ),
            new CuratedExhibit(
                    "edu-diploma",
                    "졸업장",
                    null,
                    "학생들은 학교의 정해진 과정을 이수하면 그 증표로 졸업장을 받는다. 졸업장은 헤어짐의 아쉬움과 더불어 상급학교로의 진학 또는 사회진출이라고 하는 새로운 시작을 상징한다. 대부분의 학생들에게 졸업장은 매우 소중한 것이어서 유리 액자나 예쁘게 장식된 원형의 통에 잘 보관하기도 하였다. 또한 학생들의 지나간 학교생활을 간략하게 담아낸 졸업앨범도 제작해 소중하게 간직하였다.",
                    "/images/exhibits/edu-diploma.jpg",
                    "부천시립박물관",
                    "부천시박물관 3D 전시실",
                    "https://my.matterport.com/show/?m=HsCkG1jEQ2D",
                    "교육전시실",
                    20
            ),
            new CuratedExhibit(
                    "stone-gwantong",
                    "추상석(관통석)",
                    null,
                    "관통된 부분과 그 주변의 모형이 무엇인가를 표현하는 듯한 추상미를 가진 수석이다.",
                    "/images/exhibits/stone-gwantong.jpg",
                    "부천시립박물관",
                    "부천시박물관 3D 전시실, e뮤지엄",
                    "https://my.matterport.com/show/?m=YGNH5XtWHNP",
                    "수석전시실",
                    21
            ),
            new CuratedExhibit(
                    "stone-dohyeong-sansu",
                    "도형산수경석",
                    null,
                    "산수경석이란 자연의 산명수려한 온갖 풍경의 어떤 요소가 작은 돌에 축소되어 있는 것을 말한다. 산형석, 폭포석, 호수석, 단층석, 평원석, 도형석, 바위형, 잔설형 등 여러가지로 구분한다. 산지가 영흥도로 추정되며 검은색과 하얀색 줄의 대조가 매력적이다.",
                    "/images/exhibits/stone-dohyeong-sansu.jpg",
                    "부천시립박물관",
                    "부천시박물관 누리집",
                    "https://www.bcmuseum.or.kr/ko/collection/",
                    "수석전시실",
                    22
            ),
            new CuratedExhibit(
                    "stone-sansu-munyang",
                    "산수문양석",
                    null,
                    "문양석이란 나무, 사람, 새, 짐승, 꽃, 산과 수풀, 별과 달 등 온갖 자연만상의 모양이 무늬로 새겨진 돌이며 그 무늬의 빛깔은 색채를 가질수록 좋다. 몽유도원도에 나오는 화폭의 일부를 돌에 옮겨놓은 듯한 산수문양이 돋보인다.",
                    "/images/exhibits/stone-sansu-munyang.jpg",
                    "부천시립박물관",
                    "부천시박물관 누리집",
                    "https://www.bcmuseum.or.kr/ko/collection/",
                    "수석전시실",
                    23
            ),
            new CuratedExhibit(
                    "stone-sunflower",
                    "해바라기문양석",
                    null,
                    "중심에서 바깥쪽으로 퍼져나가는 해바라기 모양의 문양이 특징인 구과상 유문암(球顆狀 流紋岩, Spherulitic Rhyolite)이다. 2004년 중암 정철환 선생(仲庵 鄭喆煥, 1931~2022)이 부천시에 수석 관련 자료를 일괄 기증할 때 함께 입수되었다. 당시 기증의 취지는 개인이 소장해 온 수석을 공공 자원으로 환원하여 영구 보존하고, 시민들에게 수석 문화의 가치와 아름다움을 널리 알려 지역 문화 발전에 기여하고자 하는 데 있었다. 부천시립박물관 소장품인 해바라기문양석은 갈색과 황토색이 어우러진 바탕 위에 중심에서 바깥으로 퍼져나가는 여러 겹의 둥근 무늬가 나타난다. 안쪽은 색이 짙고 바깥으로 갈수록 색과 결이 층층이 넓어지며, 그 모습이 해바라기 씨앗이 중심을 둘러싸고 배열된 형태와 닮아있다. 외형은 위쪽이 둥글게 다듬어진 아치형이며, 표면은 매끈하게 연마되어 은은한 광택을 띤다. 하단에는 짙은 갈색 나무 좌대를 사용해 수석의 형태와 문양을 안정감 있게 감상할 수 있도록 하였다.",
                    "/images/exhibits/stone-sunflower.jpg",
                    "부천시립박물관",
                    "부천시박물관 3D 전시실, 부천시박물관 누리집",
                    "https://my.matterport.com/show/?m=YGNH5XtWHNP",
                    "수석전시실",
                    24
            )
    );

    private CuratedExhibits() {
    }
}
