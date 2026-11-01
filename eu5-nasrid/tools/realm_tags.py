"""One tag for the realm across its formations.

The game gives a country a new tag when it forms a new nation: Naṣrid Granada (GRA) became
Al-Andalus (ADU) on 16 March 1375. The campaign's data keeps the realm as GRA throughout, so its
timelines, maps and series run on unbroken; the tools read the save's tags through `alias`, and
`GAME_TAG` keeps the game's own tag for the record.
"""
ALIAS = {'ADU': 'GRA'}


def alias(tags):
    """{country id: game tag} -> {country id: campaign tag}"""
    return {k: ALIAS.get(v, v) for k, v in tags.items()}


def game_tags(tags):
    """{campaign tag: game tag} for the tags the alias changed"""
    return {ALIAS[v]: v for v in tags.values() if v in ALIAS}
