package com.bulog.domain.exhibit.exception;

import com.bulog.domain.exhibit.exception.code.ExhibitErrorCode;
import com.bulog.global.apiPayload.exception.GeneralException;

public class ExhibitException extends GeneralException {

    public ExhibitException(ExhibitErrorCode errorCode) {
        super(errorCode);
    }

    public ExhibitException(ExhibitErrorCode errorCode, Object errorDetail) {
        super(errorCode, errorDetail);
    }
}
