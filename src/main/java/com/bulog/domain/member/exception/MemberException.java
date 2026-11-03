package com.bulog.domain.member.exception;

import com.bulog.domain.member.exception.code.MemberErrorCode;
import com.bulog.global.apiPayload.exception.GeneralException;
import java.util.Map;

public class MemberException extends GeneralException {

    public MemberException(MemberErrorCode errorCode) {
        super(errorCode);
    }

    public MemberException(MemberErrorCode errorCode, Map<String, ?> errorDetail) {
        super(errorCode, errorDetail);
    }
}
