package com.bulog.domain.collection.exception;

import com.bulog.domain.collection.exception.code.CollectionErrorCode;
import com.bulog.global.apiPayload.exception.GeneralException;
import java.util.Map;

public class CollectionException extends GeneralException {

    public CollectionException(CollectionErrorCode errorCode, Map<String, ?> errorDetail) {
        super(errorCode, errorDetail);
    }
}
