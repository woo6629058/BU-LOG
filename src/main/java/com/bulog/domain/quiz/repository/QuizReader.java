package com.bulog.domain.quiz.repository;

import com.bulog.domain.quiz.entity.Quiz;
import java.util.Optional;

public interface QuizReader {

    Optional<Quiz> findById(Long quizId);

    Optional<Quiz> findByExhibitId(String exhibitId);
}
