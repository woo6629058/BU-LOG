package com.bulog.domain.quiz.repository;

import com.bulog.domain.quiz.entity.Quiz;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizRepository extends JpaRepository<Quiz, Long>, QuizReader {

    @Override
    @EntityGraph(attributePaths = "options")
    Optional<Quiz> findById(Long quizId);

    @EntityGraph(attributePaths = "options")
    Optional<Quiz> findByExhibitId(String exhibitId);
}
