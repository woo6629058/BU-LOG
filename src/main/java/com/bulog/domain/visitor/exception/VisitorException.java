package com.bulog.domain.visitor.exception;

import com.bulog.domain.visitor.exception.code.VisitorErrorCode;
import com.bulog.global.apiPayload.exception.GeneralException;

public class VisitorException extends GeneralException {

    public VisitorException(VisitorErrorCode errorCode) {
        super(errorCode);
    }
}
