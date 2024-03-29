import React from 'react';
import range from 'lodash/range';
import { connect } from 'react-redux';

import { Cell } from 'components/Cell/Cell';

import css from './Grid.scss';


class Grid extends React.Component {
  render() {
    const { width, puzzleId } = this.props;

    return (
      <div className={css.gridContainer}>
        <div className={css.gridContent}>
          <div className={css.gridInnerContent}>
            {range(width).map(rowNumber => (
              <div className={css.gridRow} key={rowNumber}>
                {range(width).map((colNumber) => {
                  const cellNumber = rowNumber * width + colNumber;
                  return (
                    <Cell
                      key={cellNumber}
                      cellNumber={cellNumber}
                      puzzleId={puzzleId}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { width } = state.puzzle[ownProps.puzzleId] || {};
  return {
    width,
  }
};

const connectedGrid = connect(mapStateToProps)(Grid);

export {
  connectedGrid as Grid,
}
