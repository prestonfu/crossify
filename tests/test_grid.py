from crossword_generator.clue_processor import ClueProcessor
from crossword_generator.grid import Grid


def test_grid_layout_generation(size, verbose=True):
    if verbose:
        for n in range(4, 16):
            print(f"n = {n}\n{Grid(n)}\n")

    g = Grid(size)

    print('Testing grid:')
    print(g)
    print()

    if verbose:
        print(f"{g.across}\n{g.down}")
        print()

    return g


def test_clues(verbose=True):
    clue_processor = ClueProcessor('crossword-generator/data/clues.csv')
    print('Done processing clues')
    if verbose:
        print(clue_processor.words[3])
    return clue_processor


def main():
    import cProfile
    import pstats

    n = 5

    with cProfile.Profile() as pr:
        clue_processor = test_clues(verbose=False)
        num_generated_grids = 0
        i = 0
        while num_generated_grids < 10:
            print(f'Processing grid {i}')

            # test layout generation
            g = test_grid_layout_generation(n, verbose=False)

            # test fill
            g.fill(clue_processor, num_attempts=10, num_sample_strings=1000, num_test_strings=5, verbosity=0.001)  # TODO: find optimal num_test_strings, 10 seems good?

            print(f'Processed grid {i}')
            print('Final grid:')
            print(g)
            print()

            if g.is_filled():
                # continuously opening and closing file to ensure file updates after grid generated
                with open(f'crossword-generator/tests/results/{n}x{n}.txt', 'a') as f:
                    f.write(f'{g.__str__()}\n\n')
                num_generated_grids += 1
            i += 1

    stats = pstats.Stats(pr)
    stats.sort_stats(pstats.SortKey.TIME)
    stats.dump_stats(filename='crossword-generator/tests/results/crossword_generation_multiple.prof')

    print(g)


if __name__ == '__main__':
    main()
