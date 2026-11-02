package com.bulog.domain.quiz.converter;

import com.bulog.domain.quiz.dto.res.QuizAttemptResponseDTO;
import com.bulog.domain.quiz.dto.res.QuizOptionResponseDTO;
import com.bulog.domain.quiz.dto.res.QuizResponseDTO;
import com.bulog.domain.quiz.entity.Quiz;

public final class QuizConverter {

    private QuizConverter() {
    }

    public static QuizResponseDTO toResponse(Quiz quiz) {
        var options = quiz.getOptions().stream()
                .map(option -> new QuizOptionResponseDTO(option.getId(), option.getContent()))
                .toList();

        return new QuizResponseDTO(quiz.getId(), quiz.getQuestion(), options);
    }

    public static QuizAttemptResponseDTO toAttemptResponse(Quiz quiz, boolean correct) {
        return new QuizAttemptResponseDTO(correct, quiz.getExplanation());
    }
}
