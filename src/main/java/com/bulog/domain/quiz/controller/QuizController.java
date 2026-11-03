package com.bulog.domain.quiz.controller;

import com.bulog.domain.quiz.dto.req.QuizAttemptRequestDTO;
import com.bulog.domain.quiz.dto.res.QuizAttemptResponseDTO;
import com.bulog.domain.quiz.dto.res.QuizResponseDTO;
import com.bulog.domain.quiz.exception.code.QuizSuccessCode;
import com.bulog.domain.quiz.service.QuizService;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.service.VisitorRequestFilter;
import com.bulog.global.apiPayload.ApiResponse;
import com.bulog.global.security.MemberPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @GetMapping("/exhibits/{exhibitId}/quiz")
    public ApiResponse<QuizResponseDTO> getQuiz(@PathVariable String exhibitId) {
        return ApiResponse.of(
                QuizSuccessCode.QUIZ_FOUND,
                quizService.getQuizByExhibitId(exhibitId)
        );
    }

    @PostMapping("/quizzes/{quizId}/attempts")
    public ApiResponse<QuizAttemptResponseDTO> submitAttempt(
            @PathVariable Long quizId,
            @Valid @RequestBody QuizAttemptRequestDTO request,
            @RequestAttribute(VisitorRequestFilter.VISITOR_ATTRIBUTE) Visitor visitor,
            @AuthenticationPrincipal MemberPrincipal principal
    ) {
        return ApiResponse.of(
                QuizSuccessCode.QUIZ_GRADED,
                quizService.grade(
                        quizId,
                        request.selectedOptionId(),
                        visitor,
                        principal == null ? null : principal.memberId()
                )
        );
    }
}
