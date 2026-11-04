package com.bulog.domain.exhibit.service;

import com.bulog.domain.exhibit.client.EmuseumClient;
import com.bulog.domain.exhibit.client.EmuseumExhibitSummary;
import com.bulog.domain.exhibit.client.EmuseumPage;
import com.bulog.domain.exhibit.client.EmuseumProperties;
import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.repository.ExhibitRepository;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!local")
@RequiredArgsConstructor
public class ExhibitSyncService {

    private final EmuseumClient emuseumClient;
    private final EmuseumProperties properties;
    private final ExhibitRepository exhibitRepository;

    public ExhibitSyncResult syncAll() {
        int pageNumber = 1;
        int processedCount = 0;
        int createdCount = 0;
        int updatedCount = 0;
        long totalCount;

        do {
            EmuseumPage page = emuseumClient.getExhibits(pageNumber, properties.syncPageSize());
            if (page.rawItemCount() == 0 && processedCount < page.totalCount()) {
                throw new IllegalStateException("e뮤지엄 목록 동기화가 완료되기 전에 빈 페이지가 반환되었습니다.");
            }
            SyncPageResult result = storePage(page.exhibits());
            processedCount += page.rawItemCount();
            createdCount += result.createdCount();
            updatedCount += result.updatedCount();
            totalCount = page.totalCount();
            pageNumber++;
        } while (processedCount < totalCount);

        return new ExhibitSyncResult(totalCount, processedCount, createdCount, updatedCount);
    }

    private SyncPageResult storePage(List<EmuseumExhibitSummary> summaries) {
        if (summaries.isEmpty()) {
            return new SyncPageResult(0, 0);
        }
        List<String> externalIds = summaries.stream()
                .map(EmuseumExhibitSummary::id)
                .toList();
        Map<String, Exhibit> existingByExternalId = exhibitRepository
                .findAllByExternalIdIn(externalIds)
                .stream()
                .collect(Collectors.toMap(Exhibit::getExternalId, Function.identity()));

        int createdCount = 0;
        int updatedCount = 0;
        for (EmuseumExhibitSummary summary : summaries) {
            Exhibit exhibit = existingByExternalId.get(summary.id());
            if (exhibit == null) {
                exhibit = Exhibit.importFromEmuseum(
                        summary.id(),
                        summary.name(),
                        summary.museumName(),
                        summary.imageUrl()
                );
                createdCount++;
            } else {
                exhibit.updateExternalSummary(
                        summary.name(),
                        summary.museumName(),
                        summary.imageUrl()
                );
                updatedCount++;
            }
            existingByExternalId.put(summary.id(), exhibit);
        }

        Collection<Exhibit> exhibits = existingByExternalId.values();
        exhibitRepository.saveAll(exhibits);
        return new SyncPageResult(createdCount, updatedCount);
    }

    private record SyncPageResult(
            int createdCount,
            int updatedCount
    ) {
    }
}
