package com.bulog.domain.quiz.service;

import com.bulog.domain.card.dto.res.CardAcquisitionResponseDTO;
import com.bulog.domain.card.service.CardService;
import com.bulog.domain.quiz.converter.QuizConverter;
import com.bulog.domain.quiz.dto.res.QuizAttemptResponseDTO;
import com.bulog.domain.quiz.dto.res.QuizResponseDTO;
import com.bulog.domain.quiz.entity.Quiz;
import com.bulog.domain.quiz.exception.QuizException;
import com.bulog.domain.quiz.exception.code.QuizErrorCode;
import com.bulog.domain.quiz.repository.QuizReader;
import com.bulog.domain.visitor.entity.Visitor;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizReader quizReader;
    private final CardService cardService;

    @Transactional(readOnly = true)
    public QuizResponseDTO getQuizByExhibitId(String exhibitId) {
        Quiz quiz = quizReader.findByExhibitId(exhibitId)
                .orElseThrow(() -> new QuizException(
                        QuizErrorCode.QUIZ_NOT_FOUND,
                        Map.of("exhibitId", exhibitId)
                ));

        return QuizConverter.toResponse(quiz);
    }

    @Transactional
    public QuizAttemptResponseDTO grade(
            Long quizId,
            Long selectedOptionId,
            Visitor visitor,
            Long authenticatedMemberId
    ) {
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

        boolean correct = quiz.isCorrectOption(selectedOptionId);
        CardAcquisitionResponseDTO card = correct
                ? cardService.issueCard(visitor, authenticatedMemberId, quiz.getExhibitId())
                : null;
        return QuizConverter.toAttemptResponse(quiz, correct, card);
    }
}
