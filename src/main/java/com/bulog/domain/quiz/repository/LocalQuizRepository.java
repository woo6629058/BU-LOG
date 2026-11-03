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

    private static final Quiz GORYEO_CELADON_QUIZ = Quiz.create(
            1L,
            "goryeo-celadon",
            "이 전시물이 제작된 시대는 언제일까요?",
            "상감청자는 고려 시대를 대표하는 도자기입니다.",
            List.of(
                    QuizOption.create(11L, "고려", true, 1),
                    QuizOption.create(12L, "조선", false, 2),
                    QuizOption.create(13L, "삼국", false, 3)
            )
    );

    private static final Map<Long, Quiz> QUIZZES_BY_ID = Map.of(
            GORYEO_CELADON_QUIZ.getId(), GORYEO_CELADON_QUIZ
    );

    private static final Map<String, Quiz> QUIZZES_BY_EXHIBIT_ID = Map.of(
            GORYEO_CELADON_QUIZ.getExhibitId(), GORYEO_CELADON_QUIZ
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
