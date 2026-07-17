#!/usr/bin/env python3
"""Generate English content HTML files from Russian sources."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "content"
DST = SRC / "en"
DST.mkdir(parents=True, exist_ok=True)


def translate_nashi_izdeliya(text: str) -> str:
    """Translate UI chrome and common Russian strings in product catalog."""
    replacements = [
        ("Наши фрикционные изделия", "Our Friction Products"),
        (
            "Фрикционные изделия (сектора, вкладыши, пластины, кольца), изготавливаются нашей компанией как по представленным размерам, так и по любым нестандартным по чертежу заказчика.",
            "Friction products (segments, inserts, plates, rings) are manufactured by our company to the dimensions shown below or to any non-standard specifications per customer drawings.",
        ),
        ('placeholder="Поиск по маркировке (например, ВП 100-80-5)"', 'placeholder="Search by part marking (e.g., VP 100-80-5)"'),
        ("                 Найти\n", "                 Search\n"),
        ("Вкладыш фрикционный ВП", "Friction Insert VP"),
        ("Вкладыш фрикционный ВУ", "Friction Insert VU"),
        ("Вкладыш фрикционный ВК", "Friction Insert VK"),
        ("Вкладыш фрикционный Матрешка", "Friction Insert Matryoshka"),
        ("Сектор фрикционный BC", "Friction Segment BC"),
        ("Сектор фрикционный Д-019", "Friction Segment D-019"),
        ("Сектор фрикционный H-001", "Friction Segment H-001"),
        ("Сектор фрикционный", "Friction Segment"),
        ("Фрикционная пластина", "Friction Plate"),
        ("Фрикционное кольцо", "Friction Ring"),
        (
            "Колодка фрикционная тормозная 4020.81.100-1 СБ для буровой лебедки ЛБУ 1200 К",
            "Friction Brake Pad 4020.81.100-1 SB for LBU 1200 K Drilling Winch",
        ),
        ("Таблица размеров", "Dimensions Table"),
        ("Угловые", "Angular"),
        ("Круглые", "Circular"),
        ("Пластины", "Plates"),
        ("Тормозные", "Brake"),
        ("Кольца", "Rings"),
        ("Параметр B может быть любым, на заказ!", "Dimension B can be custom-specified to order!"),
        ('alt="Схема вкладша ВП: параметры A, B, C"', 'alt="VP insert diagram: parameters A, B, C"'),
        ('alt="Схема вкладша ВУ: параметры A, B, C, R"', 'alt="VU insert diagram: parameters A, B, C, R"'),
        ('alt="Схема вкладша ВК: параметры D, B"', 'alt="VK insert diagram: parameters D, B"'),
        ('alt="Схема сектора BC: параметры A, R1, R2, B"', 'alt="BC segment diagram: parameters A, R1, R2, B"'),
        ('alt="Схема сектора: параметры D1, d2, B"', 'alt="Segment diagram: parameters D1, d2, B"'),
        ('alt="Схема сектора Д-019"', 'alt="D-019 segment diagram"'),
        ('alt="Схема сектора H-001: параметры A, R1, R2, B"', 'alt="H-001 segment diagram: parameters A, R1, R2, B"'),
        ('alt="Схема фрикционной пластины"', 'alt="Friction plate diagram"'),
        ('alt="Схема тормозной колодки"', 'alt="Brake pad diagram"'),
        ('alt="Схема вкладша Матрешка: параметры A, B, C, R1, R2"', 'alt="Matryoshka insert diagram: parameters A, B, C, R1, R2"'),
        (">Артикул<", ">Part No.<"),
        (">Тип накладки (модель пресса)<", ">Lining type (press model)<"),
        (">Угол<", ">Angle<"),
        (">Длина<", ">Length<"),
        (">Ширина<", ">Width<"),
        (">на заказ<", ">custom order<"),
        (">пресс ", ">press "),
        (">Пресс ", ">Press "),
        (">пресс<", ">press<"),
        (">Пресс<", ">Press<"),
        (">Муфта ", ">Clutch "),
        (">Муфта<", ">Clutch<"),
        (">Ножницы ", ">Shears "),
        (">лебёдка ", ">winch "),
        (">лебедка ", ">winch "),
        (">рулонница)<", ">coiler)<"),
        (">валковая подача)<", ">roll feed)<"),
        ("> с отверстиями )<", "> with holes )<"),
        ("> без отверстий )<", "> without holes )<"),
        (">( С буртиком )<", ">( with flange )<"),
        (">(С лыской)<", ">( with tab )<"),
        (">( С лыской )<", ">( with tab )<"),
        (">( с отверстиями )<", ">( with holes )<"),
        (">( без отверстий )<", ">( without holes )<"),
        (">т.с.<", ">tf<"),
        (">т.с<", ">tf<"),
        (">тн.<", ">tf<"),
        (">тн<", ">tf<"),
    ]
    for old, new in replacements:
        text = text.replace(old, new)
    return text


# Files generated inline (smaller pages)
FILES = {}

# We'll read Russian sources and write translated versions
print(f"Output directory: {DST}")
