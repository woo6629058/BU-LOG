package com.bulog.domain.quiz.service;

import com.bulog.domain.quiz.converter.QuizConverter;
import com.bulog.domain.quiz.dto.res.QuizAttemptResponseDTO;
import com.bulog.domain.quiz.dto.res.QuizResponseDTO;
import com.bulog.domain.quiz.entity.Quiz;
import com.bulog.domain.quiz.exception.QuizException;
import com.bulog.domain.quiz.exception.code.QuizErrorCode;
import com.bulog.domain.quiz.repository.QuizReader;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizReader quizReader;

    @Transactional(readOnly = true)
    public QuizResponseDTO getQuizByExhibitId(String exhibitId) {
        Quiz quiz = quizReader.findByExhibitId(exhibitId)
                .orElseThrow(() -> new QuizException(
                        QuizErrorCode.QUIZ_NOT_FOUND,
                        Map.of("exhibitId", exhibitId)
                ));

        return QuizConverter.toResponse(quiz);
    }

    @Transactional(readOnly = true)
    public QuizAttemptResponseDTO grade(Long quizId, Long selectedOptionId) {
        Quiz quiz = quizReader.findById(quizId)
                .orElseThrow(() -> new QuizException(
                        QuizErrorCode.QUIZ_NOT_FOUND,
                        Map.of("quizId", quizId)
                ));

        if (!quiz.containsOption(selectedOptionId)) {
            throw new QuizException(
                    QuizErrorCode.QUIZ_OPTION_INVALID,
                    Map.of("quizId", quizId, "selectedOptionId", selectedOptionId)
            );
        }

        return QuizConverter.toAttemptResponse(quiz, quiz.isCorrectOption(selectedOptionId));
    }
}
