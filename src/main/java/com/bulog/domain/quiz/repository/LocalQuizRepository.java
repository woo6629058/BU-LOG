package com.bulog.domain.quiz.repository;

import com.bulog.domain.quiz.curation.CuratedQuizzes;
import com.bulog.domain.quiz.entity.Quiz;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

/**
 * DB 없이 켜는 local 프로필용 퀴즈 저장소.
 * 운영 서버와 같은 관찰 미션 24개(CuratedQuizzes)를 메모리에 둔다. 퀴즈 ID는 1~24.
 */
@Repository
@Profile("local")
public class LocalQuizRepository implements QuizReader {

    private static final Map<Long, Quiz> QUIZZES_BY_ID = IntStream.range(0, CuratedQuizzes.ALL.size())
            .mapToObj(index -> CuratedQuizzes.ALL.get(index).toLocalQuiz(index + 1L))
            .collect(Collectors.toUnmodifiableMap(Quiz::getId, Function.identity()));

    private static final Map<String, Quiz> QUIZZES_BY_EXHIBIT_ID = QUIZZES_BY_ID.values().stream()
            .collect(Collectors.toUnmodifiableMap(Quiz::getExhibitId, Function.identity()));

    @Override
    public Optional<Quiz> findById(Long quizId) {
        return Optional.ofNullable(QUIZZES_BY_ID.get(quizId));
    }

    @Override
    public Optional<Quiz> findByExhibitId(String exhibitId) {
        return Optional.ofNullable(QUIZZES_BY_EXHIBIT_ID.get(exhibitId));
    }
}
