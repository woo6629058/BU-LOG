package com.bulog.domain.quiz.curation;

import static com.bulog.domain.quiz.curation.CuratedQuiz.answer;
import static com.bulog.domain.quiz.curation.CuratedQuiz.option;

import java.util.List;

/**
 * 수집 대상 유물 24개의 관찰 미션 (CuratedExhibits와 같은 순서).
 * 보기는 적힌 순서가 display_order이고, 화면에서는 섞어서 보여 준다.
 * 게임 종류는 보기 모양으로 화면이 정한다.
 * - 숫자만 같은 길이(예: 221): 자물쇠, dialLabels가 왼쪽 칸부터 다이얼 이름
 * - "spot:가로%,세로%,반지름%": 사진에서 찾아 누르기
 * - "order:가>나>다": 순서대로 놓기
 * - 그 밖의 글: 객관식
 * 내용은 프론트가 정리한 미션 목록(bulog-quiz-missions.txt, 11/18)과 같다.
 */
public final class CuratedQuizzes {

    public static final List<CuratedQuiz> ALL = List.of(
            // 01 신앙항아리
            new CuratedQuiz(
                    "ongi1-faith-jar",
                    "앞에서 보이는 십자가, 어깨의 물결무늬 줄, 뚜껑 손잡이를 차례로 세어 자물쇠를 열어 보세요",
                    "십자가 2개, 물결무늬 2줄, 뚜껑 손잡이 1개예요. 점말의 천주교인들은 옹기에 십자가를 그려 신앙을 담았어요.",
                    "십자가는 쌀 미(米)자처럼 숨겨 그려져 있어요. 뚜껑 맨 위도 살펴보세요.",
                    List.of("십자가", "물결띠", "뚜껑 손잡이"),
                    List.of(
                            answer(1001L, "221"),
                            option(1002L, "212"),
                            option(1003L, "121"),
                            option(1004L, "222")
                    )
            ),
            // 02 주병
            new CuratedQuiz(
                    "ongi1-jubyeong",
                    "주병의 입구는 어떤 모양일까요?",
                    "짧은 목 끝이 바깥으로 살짝 벌어져 있어서 따를 때 흘러내리지 않아요.",
                    "병의 맨 위를 잘 보세요.",
                    null,
                    List.of(
                            option(1011L, "옆에 주둥이가 달림"),
                            option(1012L, "뚜껑이 덮여 있음"),
                            option(1013L, "길고 가느다란 목"),
                            answer(1014L, "짧은 목에 바깥으로 벌어짐")
                    )
            ),
            // 03 성주단지
            new CuratedQuiz(
                    "ongi1-seongju-danji",
                    "성주단지 뚜껑의 손잡이를 찾아 눌러 보세요",
                    "뚜껑 가운데에 작고 둥근 꼭지가 손잡이 역할을 해요.",
                    "뚜껑 한가운데를 보세요.",
                    null,
                    List.of(
                            answer(1021L, "spot:50,25,7"),
                            option(1022L, "spot:20,55,9")
                    )
            ),
            // 04 화초문항아리
            new CuratedQuiz(
                    "ongi1-flower-jar",
                    "항아리를 위에서 아래로 보며 순서대로 놓아 보세요",
                    "맨 위 주황빛 입구 아래로 꽃송이가 피고, 그 아래로 잎이 길게 뻗어 있어요.",
                    "맨 위 입구부터 차례로 내려와 보세요.",
                    null,
                    List.of(
                            option(1031L, "order:길게 뻗은 잎>꽃송이>주황빛 입구 테두리"),
                            option(1032L, "order:꽃송이>주황빛 입구 테두리>길게 뻗은 잎"),
                            answer(1033L, "order:주황빛 입구 테두리>꽃송이>길게 뻗은 잎")
                    )
            ),
            // 05 콩나물시루
            new CuratedQuiz(
                    "ongi2-kongnamul-siru",
                    "콩나물시루는 무엇 위에 올려져 있을까요?",
                    "큰 그릇에 나무 막대를 걸치고 시루를 올려, 흘러내린 물을 받았어요.",
                    "시루 아래쪽을 보세요.",
                    null,
                    List.of(
                            answer(1041L, "나무 막대를 걸친 큰 그릇"),
                            option(1042L, "돌 받침"),
                            option(1043L, "바닥에 바로"),
                            option(1044L, "네모 나무판")
                    )
            ),
            // 06 용수철문양항아리
            new CuratedQuiz(
                    "ongi2-pattern-jar",
                    "항아리를 위에서 아래로 보며 순서대로 놓아 보세요",
                    "입구 바로 아래에 작은 고리, 그 아래 몸통에 큰 고리가 그려져 있어요.",
                    "고리 무늬의 크기를 비교해 보세요.",
                    null,
                    List.of(
                            answer(1051L, "order:입구>작은 고리 무늬>큰 고리 무늬"),
                            option(1052L, "order:작은 고리 무늬>입구>큰 고리 무늬"),
                            option(1053L, "order:입구>큰 고리 무늬>작은 고리 무늬")
                    )
            ),
            // 07 소줏고리
            new CuratedQuiz(
                    "ongi2-sojutgori",
                    "술이 나오는 주둥이, 위쪽 통의 물결무늬 줄, 위아래로 쌓인 층을 세어 자물쇠를 열어 보세요",
                    "주둥이 1개, 위쪽 통의 물결무늬 2줄, 위아래 2층이에요. 아래에서 술을 데우면 올라온 김이 식으면서 맺힌 방울이 주둥이로 흘러나와 소주가 돼요.",
                    "위쪽 통 옆으로 길게 뻗은 것이 주둥이예요. 물결무늬는 위쪽 통에 있어요.",
                    List.of("주둥이", "물결무늬", "층"),
                    List.of(
                            option(1061L, "212"),
                            answer(1062L, "122"),
                            option(1063L, "121"),
                            option(1064L, "112")
                    )
            ),
            // 08 장군
            new CuratedQuiz(
                    "ongi2-janggun",
                    "장군에 물이나 술을 붓는 입구를 찾아 눌러 보세요",
                    "눕혀서 쓰는 그릇이라 입구가 몸통 옆면에 있어요.",
                    "원래는 눕혀서 쓰던 그릇이에요.",
                    null,
                    List.of(
                            option(1071L, "spot:50,18,8"),
                            answer(1072L, "spot:50,53,12")
                    )
            ),
            // 09 반달돌칼
            new CuratedQuiz(
                    "local-half-moon-knife",
                    "돌칼 수, 돌칼 1개당 구멍 수, 총 구멍 수를 세어 자물쇠를 열어 보세요",
                    "반달돌칼 2점에 구멍이 2개씩, 모두 4개예요. 구멍에 끈을 끼워 손에 걸고 이삭을 땄어요.",
                    "돌칼 1개에 구멍이 몇 개인지 먼저 세어 보세요.",
                    List.of("돌칼", "1개당 구멍", "총 구멍"),
                    List.of(
                            option(1081L, "244"),
                            option(1082L, "214"),
                            option(1083L, "222"),
                            answer(1084L, "224")
                    )
            ),
            // 10 가락바퀴
            new CuratedQuiz(
                    "local-spindle-whorl",
                    "두 가락바퀴 중 검은색 가락바퀴를 찾아 눌러 보세요",
                    "오른쪽이 검은색, 왼쪽이 갈색이에요. 가운데 구멍에 막대를 끼워 실을 꼬았어요.",
                    "두 개의 색을 비교해 보세요.",
                    null,
                    List.of(
                            answer(1091L, "spot:72,50,15"),
                            option(1092L, "spot:28,50,15")
                    )
            ),
            // 11 인화문 토기병
            new CuratedQuiz(
                    "local-inhwamun-togibyeong",
                    "토기병을 위에서 아래로 보며 순서대로 놓아 보세요",
                    "꽃잎처럼 벌어진 입구, 가는 목, 납작한 몸통, 굽 순서예요.",
                    "맨 위 입구부터 바닥까지 내려와 보세요.",
                    null,
                    List.of(
                            option(1101L, "order:꽃잎처럼 벌어진 입구>납작한 몸통>가는 목>굽(받침)"),
                            answer(1102L, "order:꽃잎처럼 벌어진 입구>가는 목>납작한 몸통>굽(받침)"),
                            option(1103L, "order:가는 목>꽃잎처럼 벌어진 입구>납작한 몸통>굽(받침)")
                    )
            ),
            // 12 청화백자연화문합
            new CuratedQuiz(
                    "local-cheonghwa-hap",
                    "뚜껑 윗면에 그려진 무늬는 어떤 모양일까요?",
                    "뚜껑에는 작은 동그라미가 가득 그려져 있어요. 연꽃 씨앗이 박힌 연밥을 표현한 거예요. 잔에는 연잎을 그렸어요.",
                    "잔이 아니라 뚜껑 윗면을 보세요.",
                    null,
                    List.of(
                            option(1111L, "연꽃잎이 빙 둘러져 있음"),
                            option(1112L, "가로 줄무늬"),
                            option(1113L, "아무 무늬 없음"),
                            answer(1114L, "작은 동그라미가 가득")
                    )
            ),
            // 13 마이센 마크가 있는 접시 액자
            new CuratedQuiz(
                    "europe-meissen-plate",
                    "쌍칼 마크, AR 글자, Meissen 글씨를 세어 자물쇠를 열어 보세요",
                    "쌍칼 마크 7개, AR 글자 1개, 필기체 Meissen 글씨 2개예요. 초창기엔 아우구스투스 왕의 머리글자 AR을, 1723년부터는 작센 지방의 쌍칼을 새겼어요.",
                    "교차한 쌍칼 마크, AR 글자, 필기체 Meissen 글씨를 차례로 세어 보세요. 아래쪽 'Meissener Porzellan'은 세지 않아요.",
                    List.of("쌍칼", "AR", "Meissen"),
                    List.of(
                            option(1121L, "711"),
                            answer(1122L, "712"),
                            option(1123L, "612"),
                            option(1124L, "722")
                    )
            ),
            // 14 세브르 평화의 화병
            new CuratedQuiz(
                    "europe-sevres-vase",
                    "화병 그림 속 하얀 새를 찾아 눌러 보세요",
                    "가운데 그림의 하얀 새는 평화를 상징하는 비둘기예요. 흰 흙을 여러 겹 얇게 발라 그렸어요.",
                    "화병 몸통 가운데 그림을 보세요.",
                    null,
                    List.of(
                            answer(1131L, "spot:45,47,9"),
                            option(1132L, "spot:50,22,8")
                    )
            ),
            // 15 우스터 '물안개 피는 호수' 화병
            new CuratedQuiz(
                    "europe-worcester-vase",
                    "화병을 위에서 아래로 보며 순서대로 놓아 보세요",
                    "맨 위에 금색 입구, 몸통에 호수 그림, 맨 아래에 금색 받침이 있어요.",
                    "맨 위 입구부터 바닥까지 내려와 보세요.",
                    null,
                    List.of(
                            option(1141L, "order:금색 입구>금색 받침>호수 그림"),
                            option(1142L, "order:호수 그림>금색 입구>금색 받침"),
                            answer(1143L, "order:금색 입구>호수 그림>금색 받침")
                    )
            ),
            // 16 로열 코펜하겐 플로라다니카 디너서비스
            new CuratedQuiz(
                    "europe-flora-danica",
                    "접시 가장자리 테두리는 어떤 모양일까요?",
                    "접시 가장자리를 금색 톱니 모양이 두르고 있어요. 접시마다 덴마크의 야생식물이 뿌리까지 그려져 있어요.",
                    "접시 맨 바깥쪽을 보세요.",
                    null,
                    List.of(
                            option(1151L, "무늬 없는 하얀 테두리"),
                            option(1152L, "파란 물결 모양"),
                            answer(1153L, "금색 톱니 모양"),
                            option(1154L, "빨간 줄 한 줄")
                    )
            ),
            // 17 과거시험답안지
            new CuratedQuiz(
                    "edu-gwageo-answer",
                    "검은 글씨 위에 주황빛 붓으로 크게 덧쓴 글자를 찾아 눌러 보세요",
                    "주황빛 큰 글자는 채점 표시예요. 채점관은 붉은 먹으로 붙은 답안지엔 '당(當)', 떨어진 답안지엔 '락(落)'을 크게 써 놓았어요.",
                    "답안지 가운데를 비스듬히 가로지르는 색을 찾아보세요.",
                    null,
                    List.of(
                            option(1161L, "spot:71,60,7"),
                            answer(1162L, "spot:52,50,22")
                    )
            ),
            // 18 고등국어
            new CuratedQuiz(
                    "edu-high-korean",
                    "이 책이 쉽게 망가지지 않도록 덧댄 것은 무엇일까요?",
                    "책등이 검은 천으로 감싸져 있어요. 책을 펼 때마다 접히는 책등이 닳지 않도록 천을 덧대어 튼튼하게 만들었어요.",
                    "책을 펼칠 때 가장 많이 접히는 곳, 책의 왼쪽 옆면을 보세요.",
                    null,
                    List.of(
                            option(1171L, "책을 묶은 가죽 끈"),
                            option(1172L, "모서리에 박은 쇠붙이"),
                            option(1173L, "표지에 씌운 투명 비닐"),
                            answer(1174L, "책등을 감싼 검은 천")
                    )
            ),
            // 19 학교종
            new CuratedQuiz(
                    "edu-school-bell",
                    "학교종 전시를 위에서 아래로 보며 순서대로 놓아 보세요",
                    "고리에 종이 걸려 있고, 종 아래로 추가 내려오며, 맨 앞 아래에 악보가 놓여 있어요.",
                    "종 아래로 무엇이 늘어져 있는지 보세요.",
                    null,
                    List.of(
                            option(1181L, "order:종을 거는 고리>종>학교종 노래 악보>종 속의 추"),
                            answer(1182L, "order:종을 거는 고리>종>종 속의 추>학교종 노래 악보"),
                            option(1183L, "order:종>종을 거는 고리>종 속의 추>학교종 노래 악보")
                    )
            ),
            // 20 졸업장
            new CuratedQuiz(
                    "edu-diploma",
                    "졸업장에 적힌 번호(제○호)로 자물쇠를 열어 보세요",
                    "졸업장 왼쪽에 \"제四三五호\", 435호라고 적혀 있어요.",
                    "四는 4, 三은 3, 五는 5예요.",
                    List.of("백", "십", "일"),
                    List.of(
                            option(1191L, "453"),
                            answer(1192L, "435"),
                            option(1193L, "345"),
                            option(1194L, "534")
                    )
            ),
            // 21 추상석(관통석)
            new CuratedQuiz(
                    "stone-gwantong",
                    "돌을 뚫고 지나가는 구멍을 찾아 눌러 보세요",
                    "물과 바람이 오랜 시간 깎아 돌을 관통한 구멍이에요.",
                    "돌 가운데 위쪽을 보세요.",
                    null,
                    List.of(
                            option(1201L, "spot:50,80,10"),
                            answer(1202L, "spot:46,37,8")
                    )
            ),
            // 22 도형산수경석
            new CuratedQuiz(
                    "stone-dohyeong-sansu",
                    "돌은 무엇 위에 놓여 있을까요?",
                    "모래를 깐 네모 쟁반 위에 산처럼 놓여 있어요.",
                    "돌 아래를 보세요.",
                    null,
                    List.of(
                            option(1211L, "둥근 나무 받침"),
                            option(1212L, "바닥에 바로"),
                            answer(1213L, "모래를 깐 네모 쟁반"),
                            option(1214L, "물이 담긴 그릇")
                    )
            ),
            // 23 산수문양석
            new CuratedQuiz(
                    "stone-sansu-munyang",
                    "돌 위의 무늬는 무슨 색 선으로 그려져 있을까요?",
                    "황갈색 돌에 검은 줄무늬가 산수처럼 보여요.",
                    "산 모양 줄무늬를 보세요.",
                    null,
                    List.of(
                            answer(1221L, "검은색"),
                            option(1222L, "빨간색"),
                            option(1223L, "파란색"),
                            option(1224L, "흰색")
                    )
            ),
            // 24 해바라기문양석
            new CuratedQuiz(
                    "stone-sunflower",
                    "해바라기문양석을 위에서 아래로 보며 순서대로 놓아 보세요",
                    "큰 해바라기 무늬 아래에 작은 둥근 무늬가 있고, 돌은 나무 받침 위에 세워져 있어요.",
                    "큰 무늬 아래를 잘 보세요.",
                    null,
                    List.of(
                            answer(1231L, "order:큰 해바라기 무늬>작은 둥근 무늬>나무 받침"),
                            option(1232L, "order:큰 해바라기 무늬>나무 받침>작은 둥근 무늬"),
                            option(1233L, "order:작은 둥근 무늬>큰 해바라기 무늬>나무 받침")
                    )
            )
    );

    private CuratedQuizzes() {
    }
}
