package com.bulog.domain.exhibit.client;

import java.util.List;

public record EmuseumPage(
        int pageNumber,
        int pageSize,
        long totalCount,
        List<EmuseumExhibitSummary> exhibits
) {
}
