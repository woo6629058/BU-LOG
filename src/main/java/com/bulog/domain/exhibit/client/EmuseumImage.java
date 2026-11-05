package com.bulog.domain.exhibit.client;

import org.springframework.http.MediaType;

public record EmuseumImage(
        MediaType contentType,
        byte[] content
) {
}
