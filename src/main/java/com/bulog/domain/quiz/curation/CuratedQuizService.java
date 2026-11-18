package com.bulog.domain.quiz.curation;

import com.bulog.domain.quiz.entity.Quiz;
import com.bulog.domain.quiz.repository.QuizRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!local")
@RequiredArgsConstructor
public class CuratedQuizService {

    private final QuizRepository quizRepository;

    @Transactional
    public CuratedQuizResult applyAll() {
        return apply(CuratedQuizzes.ALL);
    }

    @Transactional
    public CuratedQuizResult apply(List<CuratedQuiz> curatedQuizzes) {
        int createdCount = 0;
        int updatedCount = 0;
        for (CuratedQuiz curated : curatedQuizzes) {
            Optional<Quiz> existing = quizRepository.findByExhibitId(curated.exhibitId());
            Quiz quiz;
            if (existing.isPresent()) {
                quiz = existing.get();
                curated.applyTo(quiz);
                updatedCount++;
            } else {
                quiz = curated.toNewQuiz();
                createdCount++;
            }
            quizRepository.save(quiz);
        }
        return new CuratedQuizResult(curatedQuizzes.size(), createdCount, updatedCount);
    }
}
