package com.bulog.domain.exhibit.repository;

import com.bulog.domain.exhibit.entity.Exhibit;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExhibitCatalog extends ExhibitReader {

    List<Exhibit> findAllCollectible();

    Page<Exhibit> search(
            String keyword,
            String exhibitionRoom,
            Boolean collectible,
            Pageable pageable
    );
}
