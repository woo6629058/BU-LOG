package com.bulog.domain.exhibit.curation;

import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.repository.ExhibitReader;
import com.bulog.domain.exhibit.repository.ExhibitRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!local")
@RequiredArgsConstructor
public class CuratedExhibitService {

    private final ExhibitRepository exhibitRepository;

    @Transactional
    public CuratedExhibitResult applyAll() {
        return apply(CuratedExhibits.ALL);
    }

    @Transactional
    public CuratedExhibitResult apply(List<CuratedExhibit> curatedExhibits) {
        // ExhibitRepository에는 findById가 두 개(ExhibitReader, CrudRepository) 있어 ExhibitReader 쪽으로 고정한다.
        ExhibitReader exhibitReader = exhibitRepository;
        int createdCount = 0;
        int updatedCount = 0;
        for (CuratedExhibit curated : curatedExhibits) {
            Optional<Exhibit> existing = exhibitReader.findById(curated.id());
            Exhibit exhibit;
            if (existing.isPresent()) {
                exhibit = existing.get();
                curated.applyTo(exhibit);
                updatedCount++;
            } else {
                exhibit = curated.toNewExhibit();
                createdCount++;
            }
            exhibitRepository.save(exhibit);
        }
        int releasedCount = releaseRemoved(curatedExhibits);
        return new CuratedExhibitResult(curatedExhibits.size(), createdCount, updatedCount, releasedCount);
    }

    // 목록에서 빠진 유물은 수집 대상에서 해제한다. 수집 대상은 이 목록으로만 만들어지므로 일반 소장품(collectible=false)은 건드리지 않는다.
    private int releaseRemoved(List<CuratedExhibit> curatedExhibits) {
        List<String> curatedIds = curatedExhibits.stream()
                .map(CuratedExhibit::id)
                .toList();
        List<Exhibit> removed = exhibitRepository.findAllByCollectibleTrueAndIdNotIn(curatedIds);
        removed.forEach(Exhibit::releaseCuration);
        exhibitRepository.saveAll(removed);
        return removed.size();
    }
}
