package com.bulog.domain.quiz.repository;

import com.bulog.domain.quiz.entity.Quiz;
import com.bulog.domain.quiz.entity.QuizOption;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("local")
public class LocalQuizRepository implements QuizReader {

    // local 프로필 확인용 샘플 퀴즈. 샘플 카드에 없는 유물이라 정답을 맞히면 새로 채우는 흐름을 볼 수 있다.
    // 실제 관찰 미션 24개는 따로 만든다.
    private static final Quiz FLOWER_JAR_QUIZ = Quiz.create(
            1L,
            "ongi1-flower-jar",
            "화초문항아리의 몸통에는 어떤 무늬가 그려져 있을까요?",
            "화초문항아리는 몸통에 꽃과 풀 무늬를 그려 넣은 옹기입니다.",
            List.of(
                    QuizOption.create(11L, "꽃과 풀", true, 1),
                    QuizOption.create(12L, "물고기", false, 2),
                    QuizOption.create(13L, "구름", false, 3)
            )
    );

    private static final Map<Long, Quiz> QUIZZES_BY_ID = Map.of(
            FLOWER_JAR_QUIZ.getId(), FLOWER_JAR_QUIZ
    );

    private static final Map<String, Quiz> QUIZZES_BY_EXHIBIT_ID = Map.of(
            FLOWER_JAR_QUIZ.getExhibitId(), FLOWER_JAR_QUIZ
    );

    @Override
    public Optional<Quiz> findById(Long quizId) {
        return Optional.ofNullable(QUIZZES_BY_ID.get(quizId));
    }

    @Override
    public Optional<Quiz> findByExhibitId(String exhibitId) {
        return Optional.ofNullable(QUIZZES_BY_EXHIBIT_ID.get(exhibitId));
    }
}
