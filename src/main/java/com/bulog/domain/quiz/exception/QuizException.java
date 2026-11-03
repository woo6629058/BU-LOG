package com.bulog.domain.quiz.exception;

import com.bulog.domain.quiz.exception.code.QuizErrorCode;
import com.bulog.global.apiPayload.exception.GeneralException;

public class QuizException extends GeneralException {

    public QuizException(QuizErrorCode errorCode) {
        super(errorCode);
    }

    public QuizException(QuizErrorCode errorCode, Object errorDetail) {
        super(errorCode, errorDetail);
    }
}
