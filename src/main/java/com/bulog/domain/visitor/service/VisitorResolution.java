package com.bulog.domain.visitor.service;

import com.bulog.domain.visitor.entity.Visitor;

public record VisitorResolution(
        Visitor visitor,
        String rawToken,
        boolean tokenIssued
) {
}
