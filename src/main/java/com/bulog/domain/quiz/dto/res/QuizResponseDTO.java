package com.bulog.domain.quiz.dto.res;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuizResponseDTO(
        Long quizId,
        String question,
        String hint,
        List<String> dialLabels,
        List<QuizOptionResponseDTO> options
) {
}
